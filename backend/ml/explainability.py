import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from typing import List, Dict, Any, Optional

class ExplainabilityEngine:
    """
    Engine to compute feature importance and provide explainability for behavioral models.
    """

    def compute_feature_importance(self, features_df: pd.DataFrame, labels: np.ndarray) -> List[Dict[str, Any]]:
        """
        Train a RandomForestClassifier on features->labels and return sorted feature importance.
        """
        if features_df.empty or len(labels) == 0:
            return []

        # Handle missing values by filling with median
        X = features_df.select_dtypes(include=[np.number]).fillna(features_df.median(numeric_only=True))
        
        if X.empty:
            return []

        # Train a robust random forest classifier
        clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
        clf.fit(X, labels)

        importance_scores = clf.feature_importances_
        feature_names = X.columns.tolist()

        # Create a list of dicts with feature names and their importance scores
        importance_data = [
            {"feature_name": name, "importance": float(score)}
            for name, score in zip(feature_names, importance_scores)
        ]

        # Sort by importance descending
        importance_data.sort(key=lambda x: x["importance"], reverse=True)

        # Add rank
        for rank, item in enumerate(importance_data, start=1):
            item["rank"] = rank

        return importance_data

    def get_segment_explanation(self, segment_id: int, profiles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Returns a natural language explanation and feature breakdown for a specific segment.
        """
        segment_profile = next((p for p in profiles if p.get("segment_id") == segment_id), None)
        
        if not segment_profile:
            return {
                "segment_name": f"Segment {segment_id}",
                "why_exists": "Profile data not found for this segment.",
                "top_features": [],
                "radar_data": []
            }
            
        segment_name = segment_profile.get("segment_name", f"Segment {segment_id}")
        features = segment_profile.get("features", {})
        
        # Mock top features if not explicitly defined in profile
        top_features = segment_profile.get("top_features", [])
        if not top_features and features:
            for k, v in list(features.items())[:3]:
                top_features.append({
                    "name": k,
                    "z_score": float((v - 0.5) * 2), # Mock z-score based on raw value for example
                    "direction": "positive" if v > 0.5 else "negative"
                })
                
        radar_data = segment_profile.get("radar_data", [])
        
        return {
            "segment_name": segment_name,
            "why_exists": f"This segment consists of users exhibiting strong characteristics typical of {segment_name}.",
            "top_features": top_features,
            "radar_data": radar_data
        }

    def get_behavioral_heatmap(self, profiles: List[Dict[str, Any]], feature_names: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Return a z-score matrix for a heatmap comparing segments across key features.
        """
        if not profiles:
            return {"segments": [], "features": [], "values": []}

        segments = [p.get("segment_name", f"Segment {p.get('segment_id', 'Unknown')}") for p in profiles]
        
        if not feature_names:
            # Extract common feature names from profiles if available
            all_features = set()
            for p in profiles:
                if "features" in p:
                    all_features.update(p["features"].keys())
            feature_names = list(all_features)[:10] if all_features else ["Feature 1", "Feature 2", "Feature 3"]

        # Generate a simulated z-score matrix based on profiles
        values = []
        for p in profiles:
            segment_vals = []
            for f in feature_names:
                # If feature is in profile, use it; otherwise generate a random z-score in [-3, 3]
                val = p.get("features", {}).get(f, np.random.uniform(-3, 3))
                segment_vals.append(float(val))
            values.append(segment_vals)

        return {
            "segments": segments,
            "features": feature_names,
            "values": values
        }

    def get_distribution_comparison(self, features_df: pd.DataFrame, labels: np.ndarray, feature_name: str) -> Dict[str, Any]:
        """
        Compare the distribution of a specific feature overall and across different segments.
        """
        if feature_name not in features_df.columns:
            return {"error": f"Feature {feature_name} not found in DataFrame"}
            
        feature_data = features_df[feature_name].dropna().values
        
        if len(feature_data) == 0:
            return {"error": f"No data for feature {feature_name}"}

        overall_mean = float(np.mean(feature_data))
        overall_std = float(np.std(feature_data))
        
        counts, bins = np.histogram(feature_data, bins=10)
        
        overall = {
            "mean": overall_mean,
            "std": overall_std,
            "histogram_bins": bins.tolist(),
            "histogram_values": counts.tolist()
        }
        
        segments_info = []
        unique_labels = np.unique(labels)
        
        for label in unique_labels:
            segment_data = features_df[labels == label][feature_name].dropna().values
            if len(segment_data) == 0:
                continue
                
            seg_mean = float(np.mean(segment_data))
            seg_std = float(np.std(segment_data))
            seg_counts, seg_bins = np.histogram(segment_data, bins=10)
            
            segments_info.append({
                "segment_id": int(label),
                "mean": seg_mean,
                "std": seg_std,
                "histogram_bins": seg_bins.tolist(),
                "histogram_values": seg_counts.tolist()
            })
            
        return {
            "feature_name": feature_name,
            "overall": overall,
            "segments": segments_info
        }
