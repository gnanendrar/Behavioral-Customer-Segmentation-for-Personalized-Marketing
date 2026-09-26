import pandas as pd
import numpy as np
from typing import List, Dict, Any

class AnomalyRadar:
    """
    Detects behavioral anomalies for customers deviating significantly from their segment baseline.
    """

    def detect_anomalies(self, features_df: pd.DataFrame, scores_df: pd.DataFrame, labels: np.ndarray) -> List[Dict[str, Any]]:
        """
        Identify customers who deviate > 2 standard deviations from their segment mean on key metrics.
        """
        if features_df.empty or len(labels) != len(features_df):
            return []

        anomalies = []
        
        # Ensure we have a customer_id column or index
        customer_ids = features_df.index if 'customer_id' not in features_df.columns else features_df['customer_id'].values

        # Select numeric columns to analyze
        numeric_cols = features_df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Combine data for easier groupby operations
        analysis_df = features_df[numeric_cols].copy()
        analysis_df['segment_id'] = labels

        # Calculate segment means and standard deviations
        segment_stats = analysis_df.groupby('segment_id').agg(['mean', 'std'])

        # Iterate over each row and detect anomalies
        for i, row in analysis_df.iterrows():
            segment = int(row['segment_id'])
            
            # Skip if stats are missing for the segment
            if segment not in segment_stats.index:
                continue
                
            for col in numeric_cols:
                val = row[col]
                mean = segment_stats.loc[segment, (col, 'mean')]
                std = segment_stats.loc[segment, (col, 'std')]
                
                # Avoid division by zero
                if pd.isna(std) or std == 0:
                    continue
                    
                zscore = (val - mean) / std
                
                if abs(zscore) > 2.0:
                    # Determine anomaly type and severity
                    anomaly_type = "feature_deviation"
                    if "spend" in col.lower() or "amount" in col.lower():
                        anomaly_type = "purchase_spike" if zscore > 0 else "spending_drop"
                    elif "engage" in col.lower() or "login" in col.lower() or "visit" in col.lower():
                        anomaly_type = "engagement_spike" if zscore > 0 else "engagement_drop"
                        
                    severity = "high" if abs(zscore) > 3.0 else ("medium" if abs(zscore) > 2.5 else "low")
                    direction = "positive" if zscore > 0 else "negative"
                    
                    # Cap severity mapping
                    if abs(zscore) > 4.0:
                        severity = "critical"
                        
                    anomalies.append({
                        "customer_id": str(customer_ids[i] if isinstance(customer_ids, (list, np.ndarray, pd.Index)) else customer_ids),
                        "segment_id": segment,
                        "anomaly_type": anomaly_type,
                        "severity": severity,
                        "shift_direction": direction,
                        "feature_name": col,
                        "feature_value": float(val),
                        "segment_mean": float(mean),
                        "deviation_zscore": float(zscore),
                        "recommended_response": f"Investigate {direction} shift in {col}."
                    })

        # Sort by absolute zscore to get most significant
        anomalies.sort(key=lambda x: abs(x['deviation_zscore']), reverse=True)
        
        # Limit to top 50
        return anomalies[:50]
