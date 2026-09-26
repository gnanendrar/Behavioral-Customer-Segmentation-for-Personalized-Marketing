"""
Customer DNA Fingerprint Generator
Generates a unique visual behavioral fingerprint for each customer.
"""
import numpy as np
from typing import Optional
import json


class CustomerDNA:
    """Generates behavioral DNA fingerprint data for visualization."""

    DIMENSIONS = [
        {"key": "engagement", "color": "#6366F1", "label": "Engagement"},
        {"key": "loyalty", "color": "#8B5CF6", "label": "Loyalty"},
        {"key": "value", "color": "#10B981", "label": "Value"},
        {"key": "purchase_intent", "color": "#06B6D4", "label": "Intent"},
        {"key": "discount_sensitivity", "color": "#F59E0B", "label": "Discount"},
        {"key": "churn_risk", "color": "#EF4444", "label": "Churn Risk"},
        {"key": "product_affinity", "color": "#EC4899", "label": "Affinity"},
        {"key": "frequency", "color": "#14B8A6", "label": "Frequency"},
        {"key": "recency", "color": "#3B82F6", "label": "Recency"},
        {"key": "consistency", "color": "#A855F7", "label": "Consistency"},
        {"key": "digital_activity", "color": "#F97316", "label": "Digital"},
        {"key": "monetization", "color": "#84CC16", "label": "Monetization"},
    ]

    def generate_dna(
        self,
        customer_id: str,
        scores: dict,
        features: dict,
    ) -> dict:
        """
        Generate a DNA fingerprint for a single customer.

        Args:
            customer_id: Unique customer identifier
            scores: Dict with score values (engagement_score, loyalty_score, etc.)
            features: Dict with feature values

        Returns:
            DNA fingerprint data dict for frontend rendering.
        """
        bands = []
        for dim in self.DIMENSIONS:
            key = dim["key"]
            value = self._extract_dimension_value(key, scores, features)
            bands.append({
                "key": key,
                "label": dim["label"],
                "color": dim["color"],
                "value": round(float(value), 1),
                "intensity": self._value_to_intensity(value),
                "width": max(5, int(value / 100 * 40)),
            })

        dna_hash = self._compute_dna_hash(bands)

        return {
            "customer_id": customer_id,
            "bands": bands,
            "dna_hash": dna_hash,
            "dominant_trait": max(bands, key=lambda b: b["value"])["label"],
            "weakest_trait": min(bands, key=lambda b: b["value"])["label"],
            "complexity_score": round(float(np.std([b["value"] for b in bands])), 1),
        }

    def generate_batch_dna(
        self,
        scores_df,
        features_df,
    ) -> list[dict]:
        """Generate DNA for all customers in a DataFrame."""
        results = []
        for idx in range(len(scores_df)):
            row_scores = scores_df.iloc[idx].to_dict()
            row_features = features_df.iloc[idx].to_dict()
            cid = str(row_features.get("customer_id", f"CUST-{idx}"))
            results.append(self.generate_dna(cid, row_scores, row_features))
        return results

    def compare_dna(self, dna1: dict, dna2: dict) -> dict:
        """Compare two customer DNA fingerprints."""
        similarity_scores = []
        differences = []

        for b1 in dna1["bands"]:
            b2 = next((b for b in dna2["bands"] if b["key"] == b1["key"]), None)
            if b2:
                diff = abs(b1["value"] - b2["value"])
                similarity = max(0, 100 - diff)
                similarity_scores.append(similarity)
                if diff > 20:
                    direction = "higher" if b1["value"] > b2["value"] else "lower"
                    differences.append({
                        "dimension": b1["label"],
                        "customer1_value": b1["value"],
                        "customer2_value": b2["value"],
                        "difference": round(diff, 1),
                        "direction": direction,
                    })

        overall_similarity = round(float(np.mean(similarity_scores)), 1) if similarity_scores else 0.0

        return {
            "customer1_id": dna1["customer_id"],
            "customer2_id": dna2["customer_id"],
            "overall_similarity": overall_similarity,
            "similarity_label": self._similarity_label(overall_similarity),
            "key_differences": sorted(differences, key=lambda d: d["difference"], reverse=True)[:5],
            "matching_traits": [
                d["label"] for d, s in zip(dna1["bands"], similarity_scores) if s > 80
            ],
        }

    def _extract_dimension_value(self, key: str, scores: dict, features: dict) -> float:
        """Extract a 0-100 value for a DNA dimension."""
        mappings = {
            "engagement": ["engagement_score", "digital_engagement_score"],
            "loyalty": ["loyalty_score", "loyalty_index"],
            "value": ["value_score", "monetary_value"],
            "purchase_intent": ["purchase_intent_score", "cart_conversion_rate"],
            "discount_sensitivity": ["discount_sensitivity_score", "discount_dependency"],
            "churn_risk": ["churn_risk_score", "inactivity_ratio"],
            "product_affinity": ["product_affinity_score", "product_diversity"],
            "frequency": ["purchase_frequency"],
            "recency": ["recency_days"],
            "consistency": ["purchase_consistency"],
            "digital_activity": ["digital_engagement_score", "session_frequency"],
            "monetization": ["monetization_efficiency", "spending_per_visit"],
        }

        candidates = mappings.get(key, [])
        for candidate in candidates:
            if candidate in scores and not _is_nan(scores[candidate]):
                val = float(scores[candidate])
                if key == "recency":
                    val = max(0, 100 - min(val / 3.65, 100))
                return min(100, max(0, val))
            if candidate in features and not _is_nan(features[candidate]):
                val = float(features[candidate])
                if key == "recency":
                    val = max(0, 100 - min(val / 3.65, 100))
                return min(100, max(0, val))
        return 50.0

    def _value_to_intensity(self, value: float) -> str:
        """Convert a 0-100 value to a visual intensity label."""
        if value >= 80:
            return "very_high"
        elif value >= 60:
            return "high"
        elif value >= 40:
            return "medium"
        elif value >= 20:
            return "low"
        return "very_low"

    def _compute_dna_hash(self, bands: list[dict]) -> str:
        """Create a short hash string representing the DNA pattern."""
        chars = "ACDEFGHIKLMNPQRSTVWY"
        result = []
        for band in bands:
            idx = int(band["value"] / 100 * (len(chars) - 1))
            idx = min(idx, len(chars) - 1)
            result.append(chars[idx])
        return "".join(result)

    def _similarity_label(self, similarity: float) -> str:
        """Convert similarity score to human-readable label."""
        if similarity >= 90:
            return "Nearly Identical"
        elif similarity >= 75:
            return "Very Similar"
        elif similarity >= 60:
            return "Moderately Similar"
        elif similarity >= 40:
            return "Somewhat Different"
        elif similarity >= 20:
            return "Very Different"
        return "Completely Different"


def _is_nan(val) -> bool:
    """Check if a value is NaN."""
    try:
        return np.isnan(float(val))
    except (TypeError, ValueError):
        return False
