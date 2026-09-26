"""
Revenue Forecasting Engine
Projects segment-level revenue using behavioral trends.
"""
import numpy as np
import pandas as pd
from typing import Optional


class RevenueForecaster:
    """Projects future revenue by segment using behavioral trend analysis."""

    def forecast(
        self,
        features_df: pd.DataFrame,
        scores_df: pd.DataFrame,
        profiles: list[dict],
        labels: np.ndarray,
        horizon_days: int = 90,
    ) -> dict:
        """
        Generate revenue forecasts per segment.

        Args:
            features_df: Feature-engineered DataFrame
            scores_df: Scores DataFrame
            profiles: Segment profiles
            labels: Cluster labels
            horizon_days: Forecast horizon in days

        Returns:
            Forecast results with confidence bands.
        """
        segment_forecasts = []
        total_current = 0.0
        total_projected = 0.0

        for profile in profiles:
            seg_id = profile["segment_id"]
            seg_name = profile["segment_name"]
            mask = labels == seg_id
            seg_features = features_df[mask]

            # Current revenue
            if "monetary_value" in seg_features.columns:
                current_revenue = float(seg_features["monetary_value"].sum())
            elif "total_spending" in seg_features.columns:
                current_revenue = float(seg_features["total_spending"].sum())
            else:
                current_revenue = profile.get("revenue_contribution", 0) * 1000

            # Estimate daily run rate
            avg_lifetime = seg_features["customer_lifetime_days"].mean() if "customer_lifetime_days" in seg_features.columns else 365
            if avg_lifetime <= 0:
                avg_lifetime = 365
            daily_rate = current_revenue / max(avg_lifetime, 1)

            # Trend factor from behavioral signals
            trend_factor = self._compute_trend_factor(seg_features, scores_df[mask] if scores_df is not None else None, profile)

            # Project
            projected_revenue = daily_rate * horizon_days * trend_factor
            confidence_width = projected_revenue * self._confidence_spread(profile, len(seg_features))

            # Growth classification
            growth_pct = (trend_factor - 1.0) * 100
            if growth_pct > 10:
                growth_label = "Strong Growth"
            elif growth_pct > 3:
                growth_label = "Moderate Growth"
            elif growth_pct > -3:
                growth_label = "Stable"
            elif growth_pct > -10:
                growth_label = "Moderate Decline"
            else:
                growth_label = "Significant Decline"

            # Revenue risk assessment
            churn_risk = profile.get("avg_churn_risk", 30)
            risk_level = "High" if churn_risk > 60 else "Medium" if churn_risk > 35 else "Low"

            segment_forecasts.append({
                "segment_id": seg_id,
                "segment_name": seg_name,
                "customer_count": profile.get("customer_count", int(mask.sum())),
                "current_period_revenue": round(float(current_revenue), 2),
                "projected_revenue": round(float(projected_revenue), 2),
                "projected_revenue_low": round(float(projected_revenue - confidence_width), 2),
                "projected_revenue_high": round(float(projected_revenue + confidence_width), 2),
                "growth_rate_pct": round(float(growth_pct), 1),
                "growth_label": growth_label,
                "trend_factor": round(float(trend_factor), 3),
                "daily_run_rate": round(float(daily_rate), 2),
                "revenue_risk": risk_level,
                "churn_risk_avg": round(float(churn_risk), 1),
                "confidence_level": "Medium",
            })

            total_current += current_revenue
            total_projected += projected_revenue

        # Sort by projected revenue descending
        segment_forecasts.sort(key=lambda x: x["projected_revenue"], reverse=True)

        total_growth = ((total_projected / max(total_current, 1)) - 1) * 100 if total_current > 0 else 0

        return {
            "disclaimer": "FORECAST — These are statistical projections based on historical behavioral trends. Actual results may differ significantly.",
            "horizon_days": horizon_days,
            "horizon_label": f"Next {horizon_days} days",
            "total_current_revenue": round(float(total_current), 2),
            "total_projected_revenue": round(float(total_projected), 2),
            "total_growth_pct": round(float(total_growth), 1),
            "segment_forecasts": segment_forecasts,
            "top_growth_segment": max(segment_forecasts, key=lambda x: x["growth_rate_pct"])["segment_name"] if segment_forecasts else "N/A",
            "highest_risk_segment": max(segment_forecasts, key=lambda x: x["churn_risk_avg"])["segment_name"] if segment_forecasts else "N/A",
        }

    def _compute_trend_factor(self, features: pd.DataFrame, scores: Optional[pd.DataFrame], profile: dict) -> float:
        """Compute a trend multiplier based on behavioral signals."""
        signals = []

        # Recency signal: lower recency = positive trend
        if "recency_days" in features.columns:
            avg_recency = features["recency_days"].mean()
            if avg_recency < 30:
                signals.append(1.15)
            elif avg_recency < 90:
                signals.append(1.05)
            elif avg_recency < 180:
                signals.append(0.95)
            else:
                signals.append(0.80)

        # Engagement trend
        engagement = profile.get("avg_engagement_score", 50)
        if engagement > 70:
            signals.append(1.12)
        elif engagement > 50:
            signals.append(1.03)
        elif engagement > 30:
            signals.append(0.95)
        else:
            signals.append(0.82)

        # Churn risk signal
        churn = profile.get("avg_churn_risk", 30)
        if churn > 70:
            signals.append(0.75)
        elif churn > 50:
            signals.append(0.88)
        elif churn > 30:
            signals.append(0.98)
        else:
            signals.append(1.08)

        # Purchase frequency signal
        if "purchase_frequency" in features.columns:
            avg_freq = features["purchase_frequency"].mean()
            if avg_freq > 2:
                signals.append(1.10)
            elif avg_freq > 1:
                signals.append(1.02)
            else:
                signals.append(0.90)

        if signals:
            return float(np.mean(signals))
        return 1.0

    def _confidence_spread(self, profile: dict, n_customers: int) -> float:
        """Calculate confidence band width as fraction of projected revenue."""
        base_spread = 0.25

        if n_customers > 500:
            base_spread *= 0.7
        elif n_customers > 100:
            base_spread *= 0.85
        elif n_customers < 20:
            base_spread *= 1.5

        churn = profile.get("avg_churn_risk", 30)
        if churn > 60:
            base_spread *= 1.3

        return min(base_spread, 0.50)
