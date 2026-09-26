"""
Micro-Segment Discovery Engine
Finds niche sub-segments within primary segments.
"""
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from typing import Optional


class MicroSegmentEngine:
    """Discovers micro-segments within primary segments."""

    def __init__(self, min_k: int = 2, max_k: int = 4, min_segment_size: int = 30):
        self.min_k = min_k
        self.max_k = max_k
        self.min_segment_size = min_segment_size
        self.micro_segments: list[dict] = []

    def discover(
        self,
        features_df: pd.DataFrame,
        scores_df: pd.DataFrame,
        labels: np.ndarray,
        profiles: list[dict],
    ) -> list[dict]:
        """
        Run secondary clustering within each primary segment.

        Args:
            features_df: Feature-engineered DataFrame
            scores_df: Scores DataFrame
            labels: Primary cluster labels
            profiles: Primary segment profiles

        Returns:
            List of micro-segment dicts.
        """
        self.micro_segments = []
        numeric_cols = features_df.select_dtypes(include=[np.number]).columns.tolist()
        id_cols = ["customer_id"]
        feature_cols = [c for c in numeric_cols if c not in id_cols]

        for profile in profiles:
            seg_id = profile["segment_id"]
            seg_name = profile["segment_name"]
            mask = labels == seg_id
            seg_features = features_df.loc[mask, feature_cols].copy()
            seg_scores = scores_df.loc[mask].copy() if scores_df is not None else None
            seg_customer_ids = features_df.loc[mask, "customer_id"].values if "customer_id" in features_df.columns else np.arange(mask.sum())

            if len(seg_features) < self.min_segment_size:
                continue

            seg_features_clean = seg_features.fillna(0).replace([np.inf, -np.inf], 0)

            scaler = StandardScaler()
            X = scaler.fit_transform(seg_features_clean)

            best_k = self.min_k
            best_score = -1
            best_labels = None

            for k in range(self.min_k, min(self.max_k + 1, len(seg_features) // 10 + 1)):
                if k < 2 or k >= len(seg_features):
                    continue
                try:
                    km = KMeans(n_clusters=k, init="k-means++", n_init=5, random_state=42, max_iter=200)
                    sub_labels = km.fit_predict(X)
                    if len(set(sub_labels)) < 2:
                        continue
                    score = silhouette_score(X, sub_labels, sample_size=min(1000, len(X)))
                    if score > best_score:
                        best_score = score
                        best_k = k
                        best_labels = sub_labels
                except Exception:
                    continue

            if best_labels is None:
                continue

            if best_score < 0.15:
                continue

            for sub_id in range(best_k):
                sub_mask = best_labels == sub_id
                sub_features = seg_features_clean[sub_mask]

                sub_count = int(sub_mask.sum())
                if sub_count < 5:
                    continue

                sub_means = sub_features.mean()
                seg_means = seg_features_clean.mean()
                seg_stds = seg_features_clean.std().replace(0, 1)
                z_scores = ((sub_means - seg_means) / seg_stds).to_dict()

                top_deviations = sorted(
                    [(k, v) for k, v in z_scores.items() if abs(v) > 0.3],
                    key=lambda x: abs(x[1]),
                    reverse=True,
                )[:5]

                sub_name = self._generate_micro_name(seg_name, z_scores, top_deviations)
                characteristics = self._generate_characteristics(top_deviations)

                sub_scores_mean = {}
                if seg_scores is not None:
                    score_cols = [c for c in seg_scores.columns if c.endswith("_score")]
                    sub_score_data = seg_scores.iloc[sub_mask.nonzero()[0]] if isinstance(sub_mask, np.ndarray) else seg_scores.loc[sub_mask]
                    sub_scores_mean = {c: round(float(sub_score_data[c].mean()), 1) for c in score_cols if c in sub_score_data.columns}

                micro_seg = {
                    "parent_segment_id": seg_id,
                    "parent_segment_name": seg_name,
                    "micro_segment_id": f"{seg_id}_{sub_id}",
                    "micro_segment_name": sub_name,
                    "customer_count": sub_count,
                    "percentage_of_parent": round(sub_count / mask.sum() * 100, 1),
                    "percentage_of_total": round(sub_count / len(features_df) * 100, 1),
                    "key_characteristics": characteristics,
                    "top_deviations": [
                        {"feature": k, "z_score": round(float(v), 2)} for k, v in top_deviations
                    ],
                    "avg_scores": sub_scores_mean,
                    "silhouette_score": round(float(best_score), 3),
                    "customer_ids": [str(cid) for cid in seg_customer_ids[sub_mask]] if len(seg_customer_ids) == len(sub_mask) else [],
                }
                self.micro_segments.append(micro_seg)

        return self.micro_segments

    def get_micro_segments_for_parent(self, parent_segment_id: int) -> list[dict]:
        """Get all micro-segments for a given parent segment."""
        return [ms for ms in self.micro_segments if ms["parent_segment_id"] == parent_segment_id]

    def _generate_micro_name(
        self,
        parent_name: str,
        z_scores: dict,
        top_deviations: list[tuple],
    ) -> str:
        """Generate a meaningful name for a micro-segment."""
        if not top_deviations:
            return f"{parent_name} — Variant"

        top_feature, top_z = top_deviations[0]
        direction = "High" if top_z > 0 else "Low"

        name_mappings = {
            "discount_dependency": ("Deal Seekers", "Full-Price Buyers"),
            "coupon_usage": ("Coupon Stackers", "Non-Coupon Users"),
            "email_engagement_rate": ("Email Responsive", "Email Passive"),
            "session_frequency": ("Power Browsers", "Light Browsers"),
            "purchase_frequency": ("Frequent Shoppers", "Occasional Shoppers"),
            "avg_order_value": ("Big Spenders", "Budget Shoppers"),
            "cart_abandonment_rate": ("Cart Abandoners", "Decisive Buyers"),
            "return_rate": ("Frequent Returners", "Keep-All Buyers"),
            "product_diversity": ("Multi-Category Explorers", "Category Focused"),
            "recency_days": ("Lapsed Visitors", "Recent Visitors"),
            "engagement_frequency": ("Hyper-Engaged", "Passive Observers"),
            "monetization_efficiency": ("High Converters", "Low Converters"),
            "customer_lifetime_days": ("Long-Tenure", "Short-Tenure"),
            "spending_per_visit": ("High-Intent Visitors", "Browsing Visitors"),
        }

        if top_feature in name_mappings:
            pos_name, neg_name = name_mappings[top_feature]
            sub_label = pos_name if top_z > 0 else neg_name
        else:
            sub_label = f"{direction}-{self._clean_feature_name(top_feature)}"

        return f"{parent_name} — {sub_label}"

    def _generate_characteristics(self, top_deviations: list[tuple]) -> list[str]:
        """Generate human-readable characteristic strings."""
        chars = []
        for feature, z_score in top_deviations:
            direction = "significantly higher" if z_score > 1 else "higher" if z_score > 0 else "significantly lower" if z_score < -1 else "lower"
            clean_name = self._clean_feature_name(feature)
            chars.append(f"{clean_name} is {direction} than segment average")
        return chars

    def _clean_feature_name(self, feature: str) -> str:
        """Convert feature_name to Feature Name."""
        return feature.replace("_", " ").title()
