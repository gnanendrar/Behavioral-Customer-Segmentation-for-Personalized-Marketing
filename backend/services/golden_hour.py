import pandas as pd
import numpy as np
from typing import List, Dict, Any

class GoldenHourAnalyzer:
    """
    Analyzes and determines the best times to engage different customer segments.
    """

    def analyze(self, features_df: pd.DataFrame, profiles: List[Dict[str, Any]], labels: np.ndarray) -> List[Dict[str, Any]]:
        """
        Determines the golden hour (best engagement time) for each segment using heuristics.
        """
        golden_hours = []
        
        for profile in profiles:
            segment_id = profile.get("segment_id", 0)
            segment_name = str(profile.get("segment_name", f"Segment {segment_id}")).lower()
            
            best_days = ["Wednesday", "Thursday"]
            best_hours = "12:00 PM - 2:00 PM"
            dead_zones = "12:00 AM - 6:00 AM"
            confidence = "low"
            
            if "engagement" in segment_name or "active" in segment_name:
                best_days = ["Monday", "Tuesday", "Wednesday"]
                best_hours = "9:00 AM - 11:00 AM"
                confidence = "medium"
                
            elif "promo" in segment_name or "discount" in segment_name or "sale" in segment_name:
                best_days = ["Saturday", "Sunday"]
                best_hours = "1:00 PM - 4:00 PM"
                confidence = "medium"
                
            elif "new" in segment_name or "onboard" in segment_name:
                best_days = ["Tuesday", "Wednesday", "Thursday"]
                best_hours = "6:00 PM - 8:00 PM"
                confidence = "medium"
                
            elif "risk" in segment_name or "churn" in segment_name:
                best_days = ["Monday", "Tuesday"]
                best_hours = "8:00 AM - 10:00 AM"
                dead_zones = "Friday Evening, Weekends"
                confidence = "low"
                
            elif "dormant" in segment_name:
                best_days = ["Thursday", "Friday", "Saturday"]
                best_hours = "Varied (Requires A/B Testing)"
                dead_zones = "Early Morning"
                confidence = "low"

            golden_hours.append({
                "segment_id": segment_id,
                "segment_name": profile.get("segment_name", f"Segment {segment_id}"),
                "best_days": best_days,
                "best_hours": best_hours,
                "dead_zones": dead_zones,
                "confidence": confidence
            })
            
        return golden_hours
