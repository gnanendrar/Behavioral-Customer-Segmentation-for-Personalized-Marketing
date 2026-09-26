"""
What-If Marketing Simulator
Estimates impact of marketing actions on customer segments.
"""
import numpy as np
import pandas as pd
from typing import Optional


class MarketingSimulator:
    """
    Simulates the potential impact of marketing actions on customer segments.
    All results are clearly labeled as estimates/simulations.
    """

    # Behavioral elasticities (empirical baselines from marketing research)
    ELASTICITIES = {
        "discount": {
            "purchase_frequency": 0.15,   # 10% discount → ~1.5% freq increase
            "avg_order_value": -0.05,     # Slight AOV decrease with discounts
            "churn_risk": -0.10,          # Reduces churn risk
            "engagement": 0.08,           # Slight engagement boost
            "revenue": 0.08,              # Net revenue effect
        },
        "engagement_campaign": {
            "purchase_frequency": 0.05,
            "avg_order_value": 0.02,
            "churn_risk": -0.15,
            "engagement": 0.25,
            "revenue": 0.06,
        },
        "loyalty_program": {
            "purchase_frequency": 0.12,
            "avg_order_value": 0.08,
            "churn_risk": -0.20,
            "engagement": 0.15,
            "revenue": 0.18,
        },
        "premium_offer": {
            "purchase_frequency": 0.03,
            "avg_order_value": 0.20,
            "churn_risk": -0.05,
            "engagement": 0.05,
            "revenue": 0.15,
        },
        "reactivation": {
            "purchase_frequency": 0.20,
            "avg_order_value": 0.0,
            "churn_risk": -0.25,
            "engagement": 0.30,
            "revenue": 0.12,
        },
        "cross_sell": {
            "purchase_frequency": 0.08,
            "avg_order_value": 0.15,
            "churn_risk": -0.05,
            "engagement": 0.10,
            "revenue": 0.20,
        },
        "price_increase": {
            "purchase_frequency": -0.10,
            "avg_order_value": 0.15,
            "churn_risk": 0.12,
            "engagement": -0.05,
            "revenue": 0.03,
        },
        "stop_discounting": {
            "purchase_frequency": -0.08,
            "avg_order_value": 0.10,
            "churn_risk": 0.15,
            "engagement": -0.03,
            "revenue": 0.02,
        },
    }

    def simulate(
        self,
        action: str,
        intensity: float,
        segment_profile: dict,
        features_df: pd.DataFrame,
        scores_df: pd.DataFrame,
        labels: np.ndarray,
        segment_id: int,
    ) -> dict:
        """
        Simulate the impact of a marketing action on a segment.

        Args:
            action: Type of action (discount, engagement_campaign, loyalty_program, etc.)
            intensity: Intensity of the action (0-100 scale, e.g., 10 for 10% discount)
            segment_profile: Profile dict for the target segment
            features_df: Feature DataFrame
            scores_df: Scores DataFrame
            labels: Cluster labels
            segment_id: Target segment ID

        Returns:
            Simulation results with projected changes.
        """
        elasticities = self.ELASTICITIES.get(action, self.ELASTICITIES["engagement_campaign"])
        intensity_factor = intensity / 10.0  # Normalize to a multiplier

        # Get current segment metrics
        seg_mask = labels == segment_id
        seg_features = features_df[seg_mask]
        seg_scores = scores_df[seg_mask] if scores_df is not None else None

        current_metrics = self._get_current_metrics(segment_profile, seg_features, seg_scores)

        # Apply elasticities with segment-specific modifiers
        segment_modifiers = self._get_segment_modifiers(segment_profile, action)

        projected = {}
        changes = {}
        for metric, elasticity in elasticities.items():
            current_val = current_metrics.get(metric, 0)
            modifier = segment_modifiers.get(metric, 1.0)
            change_pct = elasticity * intensity_factor * modifier

            # Add some variance for realism
            noise = np.random.normal(0, abs(change_pct) * 0.1)
            change_pct += noise

            new_val = current_val * (1 + change_pct)
            if metric == "churn_risk":
                new_val = max(0, min(100, new_val))

            projected[metric] = round(float(new_val), 2)
            changes[metric] = {
                "current": round(float(current_val), 2),
                "projected": round(float(new_val), 2),
                "change_pct": round(float(change_pct * 100), 1),
                "direction": "increase" if change_pct > 0 else "decrease" if change_pct < 0 else "stable",
            }

        # Revenue projection
        customer_count = segment_profile.get("customer_count", 0)
        current_revenue = current_metrics.get("revenue", 0)
        revenue_change_pct = elasticities.get("revenue", 0) * intensity_factor * segment_modifiers.get("revenue", 1.0)
        projected_revenue = current_revenue * (1 + revenue_change_pct)
        revenue_impact = projected_revenue - current_revenue

        # Confidence based on data quality and action type
        confidence = self._estimate_confidence(action, customer_count, intensity)

        return {
            "simulation_type": "ESTIMATE — NOT A GUARANTEED OUTCOME",
            "disclaimer": "These projections are based on historical behavioral correlations and industry benchmarks. Actual results may vary significantly. Use as directional guidance only.",
            "action": action,
            "action_label": action.replace("_", " ").title(),
            "intensity": intensity,
            "target_segment": segment_profile.get("segment_name", f"Segment {segment_id}"),
            "target_segment_id": segment_id,
            "customer_count": customer_count,
            "current_metrics": {k: round(float(v), 2) for k, v in current_metrics.items()},
            "projected_changes": changes,
            "revenue_impact": {
                "current_revenue": round(float(current_revenue), 2),
                "projected_revenue": round(float(projected_revenue), 2),
                "revenue_change": round(float(revenue_impact), 2),
                "revenue_change_pct": round(float(revenue_change_pct * 100), 1),
            },
            "confidence": confidence,
            "confidence_label": "High" if confidence > 0.7 else "Medium" if confidence > 0.4 else "Low",
            "time_horizon": "Next 90 days (estimated)",
            "risks": self._identify_risks(action, intensity, segment_profile),
            "recommendations": self._generate_recommendations(action, changes, segment_profile),
        }

    def get_available_actions(self) -> list[dict]:
        """Return list of available simulation actions."""
        actions = [
            {"id": "discount", "label": "Apply Discount", "description": "Offer percentage discount to the segment", "intensity_label": "Discount %", "intensity_range": [5, 50]},
            {"id": "engagement_campaign", "label": "Engagement Campaign", "description": "Launch targeted engagement campaign", "intensity_label": "Campaign Intensity", "intensity_range": [10, 100]},
            {"id": "loyalty_program", "label": "Loyalty Program", "description": "Enroll segment in loyalty program", "intensity_label": "Reward Level", "intensity_range": [10, 100]},
            {"id": "premium_offer", "label": "Premium Offer", "description": "Offer premium/upgraded products", "intensity_label": "Offer Intensity", "intensity_range": [10, 100]},
            {"id": "reactivation", "label": "Reactivation Campaign", "description": "Win-back dormant customers", "intensity_label": "Campaign Intensity", "intensity_range": [10, 100]},
            {"id": "cross_sell", "label": "Cross-Sell Campaign", "description": "Recommend complementary products", "intensity_label": "Campaign Intensity", "intensity_range": [10, 100]},
            {"id": "price_increase", "label": "Price Increase", "description": "Increase prices for the segment", "intensity_label": "Price Increase %", "intensity_range": [5, 30]},
            {"id": "stop_discounting", "label": "Stop Discounting", "description": "Remove discounts from the segment", "intensity_label": "Reduction %", "intensity_range": [50, 100]},
        ]
        return actions

    def _get_current_metrics(self, profile: dict, features: pd.DataFrame, scores: Optional[pd.DataFrame]) -> dict:
        """Extract current metrics for the segment."""
        metrics = {}
        metrics["purchase_frequency"] = profile.get("avg_purchase_frequency", features["purchase_frequency"].mean() if "purchase_frequency" in features.columns else 1.0)
        metrics["avg_order_value"] = profile.get("avg_order_value", features["avg_order_value"].mean() if "avg_order_value" in features.columns else 50.0)
        metrics["churn_risk"] = profile.get("avg_churn_risk", 30.0)
        metrics["engagement"] = profile.get("avg_engagement_score", 50.0)

        customer_count = profile.get("customer_count", len(features))
        avg_spending = features["monetary_value"].mean() if "monetary_value" in features.columns else (features["total_spending"].mean() if "total_spending" in features.columns else 500.0)
        metrics["revenue"] = float(avg_spending * customer_count)

        return metrics

    def _get_segment_modifiers(self, profile: dict, action: str) -> dict:
        """Get segment-specific modifiers based on behavioral characteristics."""
        modifiers = {k: 1.0 for k in ["purchase_frequency", "avg_order_value", "churn_risk", "engagement", "revenue"]}

        churn_risk = profile.get("avg_churn_risk", 30)
        discount_sens = profile.get("avg_discount_sensitivity", 30)
        engagement = profile.get("avg_engagement_score", 50)

        if action == "discount":
            if discount_sens > 60:
                modifiers["purchase_frequency"] = 1.8
                modifiers["revenue"] = 1.5
            elif discount_sens < 30:
                modifiers["purchase_frequency"] = 0.5
                modifiers["revenue"] = 0.6

        elif action == "reactivation":
            if churn_risk > 70:
                modifiers["engagement"] = 1.5
                modifiers["churn_risk"] = 1.3
            elif churn_risk < 30:
                modifiers["engagement"] = 0.3
                modifiers["churn_risk"] = 0.3

        elif action == "engagement_campaign":
            if engagement < 30:
                modifiers["engagement"] = 1.8
            elif engagement > 70:
                modifiers["engagement"] = 0.4

        elif action == "stop_discounting":
            if discount_sens > 60:
                modifiers["churn_risk"] = 2.0
                modifiers["purchase_frequency"] = 1.5
            elif discount_sens < 30:
                modifiers["churn_risk"] = 0.3
                modifiers["purchase_frequency"] = 0.3

        return modifiers

    def _estimate_confidence(self, action: str, customer_count: int, intensity: float) -> float:
        """Estimate confidence level of the simulation."""
        base_confidence = 0.6

        if customer_count > 500:
            base_confidence += 0.15
        elif customer_count > 100:
            base_confidence += 0.08
        elif customer_count < 20:
            base_confidence -= 0.20

        if intensity > 50:
            base_confidence -= 0.10
        elif intensity < 15:
            base_confidence += 0.05

        if action in ("discount", "engagement_campaign"):
            base_confidence += 0.05
        elif action in ("price_increase", "stop_discounting"):
            base_confidence -= 0.10

        return max(0.1, min(0.95, base_confidence))

    def _identify_risks(self, action: str, intensity: float, profile: dict) -> list[str]:
        """Identify risks associated with the simulated action."""
        risks = []

        if action == "discount" and intensity > 25:
            risks.append("High discount levels may erode brand value and create discount dependency")
        if action == "discount" and profile.get("avg_discount_sensitivity", 0) > 60:
            risks.append("This segment is already discount-dependent — further discounts may deepen dependency")
        if action == "stop_discounting" and profile.get("avg_discount_sensitivity", 0) > 60:
            risks.append("HIGH RISK: This segment relies heavily on discounts. Abrupt removal may cause significant churn")
        if action == "price_increase" and profile.get("avg_churn_risk", 0) > 50:
            risks.append("Price increases on at-risk customers may accelerate churn")
        if action == "engagement_campaign" and profile.get("avg_engagement_score", 0) > 80:
            risks.append("This segment is already highly engaged — additional campaigns may cause fatigue")
        if action == "reactivation" and profile.get("avg_churn_risk", 0) < 20:
            risks.append("This segment has low churn risk — reactivation campaign may not be cost-effective")

        if not risks:
            risks.append("No significant risks identified for this scenario")

        return risks

    def _generate_recommendations(self, action: str, changes: dict, profile: dict) -> list[str]:
        """Generate recommendations based on simulation results."""
        recs = []

        positive_changes = [k for k, v in changes.items() if v.get("direction") == "increase" and k != "churn_risk"]
        negative_changes = [k for k, v in changes.items() if v.get("direction") == "decrease" and k != "churn_risk"]

        if positive_changes:
            recs.append(f"Positive projected impact on: {', '.join(c.replace('_', ' ').title() for c in positive_changes)}")

        churn_change = changes.get("churn_risk", {})
        if churn_change.get("direction") == "decrease":
            recs.append(f"Churn risk projected to decrease by {abs(churn_change.get('change_pct', 0))}%")
        elif churn_change.get("direction") == "increase":
            recs.append(f"⚠️ Churn risk may increase by {abs(churn_change.get('change_pct', 0))}% — monitor closely")

        recs.append("Run an A/B test with 10-20% of the segment before full rollout")
        recs.append("Monitor results weekly for the first 30 days and adjust based on actual response")

        return recs
