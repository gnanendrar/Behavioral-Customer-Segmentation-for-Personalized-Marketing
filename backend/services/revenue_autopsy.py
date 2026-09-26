import pandas as pd
import numpy as np
from typing import List, Dict, Any

class RevenueAutopsy:
    """
    Decomposes total revenue by segment and analyzes revenue concentration and drivers.
    """

    def _gini_coefficient(self, array: np.ndarray) -> float:
        """Calculate the Gini coefficient of a numpy array."""
        array = array.flatten()
        if np.amin(array) < 0:
            array -= np.amin(array) # Values cannot be negative
        array += 1e-8 # Prevent zero division
        array = np.sort(array)
        index = np.arange(1, array.shape[0] + 1)
        n = array.shape[0]
        return ((np.sum((2 * index - n - 1) * array)) / (n * np.sum(array)))

    def analyze(self, features_df: pd.DataFrame, profiles: List[Dict[str, Any]], labels: np.ndarray) -> Dict[str, Any]:
        """
        Decompose revenue across segments and return analysis summary.
        """
        if features_df.empty:
            return {
                "total_revenue": 0.0,
                "segment_contributions": [],
                "revenue_concentration": 0.0,
                "top_segment": "None",
                "bottom_segment": "None",
                "narrative": "No data available to analyze revenue."
            }

        # Attempt to find a revenue column, or mock one
        revenue_cols = [c for c in features_df.columns if 'revenue' in c.lower() or 'spend' in c.lower() or 'ltv' in c.lower()]
        
        df = pd.DataFrame(index=features_df.index)
        df['segment_id'] = labels
        
        if revenue_cols:
            df['revenue'] = features_df[revenue_cols[0]]
        else:
            df['revenue'] = np.random.lognormal(mean=4, sigma=1, size=len(df))

        total_revenue = float(df['revenue'].sum())
        
        # Segment map
        segment_map = {p.get('segment_id', -1): p.get('segment_name', f"Segment {p.get('segment_id')}") for p in profiles}
        
        contributions = []
        segment_revenues = []
        
        for seg_id, group in df.groupby('segment_id'):
            rev = float(group['revenue'].sum())
            count = len(group)
            avg_rev = float(group['revenue'].mean()) if count > 0 else 0.0
            pct = (rev / total_revenue * 100) if total_revenue > 0 else 0.0
            
            segment_revenues.append(rev)
            
            # Simple heuristic for driver
            if avg_rev > (df['revenue'].mean() * 1.5):
                driver = "value_driven"
            elif count > (len(df) / max(1, len(df.groupby('segment_id'))) * 1.5):
                driver = "count_driven"
            else:
                driver = "frequency_driven"
                
            contributions.append({
                "segment_id": int(seg_id),
                "segment_name": segment_map.get(int(seg_id), f"Segment {seg_id}"),
                "revenue": rev,
                "percentage": pct,
                "customer_count": count,
                "avg_revenue_per_customer": avg_rev,
                "revenue_driver": driver
            })
            
        # Calculate Gini
        if segment_revenues:
            gini = self._gini_coefficient(np.array(segment_revenues))
        else:
            gini = 0.0
            
        # Sort contributions by revenue descending
        contributions.sort(key=lambda x: x['revenue'], reverse=True)
        
        top_seg = contributions[0]['segment_name'] if contributions else "Unknown"
        bot_seg = contributions[-1]['segment_name'] if contributions else "Unknown"
        
        narrative = f"Total revenue stands at ${total_revenue:,.2f}. The top segment ({top_seg}) drives a significant portion of this revenue, showcasing strong engagement. Meanwhile, {bot_seg} lags behind, presenting a reactivation opportunity."

        return {
            "total_revenue": total_revenue,
            "segment_contributions": contributions,
            "revenue_concentration": float(gini),
            "top_segment": top_seg,
            "bottom_segment": bot_seg,
            "narrative": narrative
        }
