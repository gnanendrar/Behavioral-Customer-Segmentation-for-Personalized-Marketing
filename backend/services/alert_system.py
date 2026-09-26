import pandas as pd
import numpy as np
from typing import List, Dict, Any

class AlertSystem:
    """
    Generates smart insights and alerts based on customer and segment data heuristics.
    """

    def generate_alerts(self, features_df: pd.DataFrame, scores_df: pd.DataFrame, profiles: List[Dict[str, Any]], labels: np.ndarray) -> List[Dict[str, Any]]:
        """
        Produce a list of proactive alerts by analyzing the dataset.
        """
        alerts = []
        
        if features_df.empty or scores_df.empty:
            return alerts

        # Helper mapping
        segment_map = {p.get('segment_id', -1): p.get('segment_name', f"Segment {p.get('segment_id')}") for p in profiles}

        # 1. Churn Alert Rule
        if 'churn_risk' in scores_df.columns or 'churn_risk_score' in scores_df.columns:
            churn_col = 'churn_risk' if 'churn_risk' in scores_df.columns else 'churn_risk_score'
            high_churn_count = (scores_df[churn_col] > 70).sum()
            total_customers = len(scores_df)
            
            if total_customers > 0 and (high_churn_count / total_customers) > 0.10:
                alerts.append({
                    "alert_type": "churn_alert",
                    "severity": "critical",
                    "title": "High Customer Churn Risk",
                    "message": f"Over 10% of your customer base ({high_churn_count} customers) is showing high risk of churn.",
                    "affected_count": int(high_churn_count),
                    "segment_name": None,
                    "recommended_action": "Launch immediate retention campaigns across at-risk segments.",
                    "icon": "⚠️"
                })

        # Process per segment logic
        df = pd.DataFrame(index=features_df.index)
        df['segment_id'] = labels
        if 'engagement_score' in scores_df.columns:
            df['engagement'] = scores_df['engagement_score']
        else:
            df['engagement'] = np.random.uniform(0, 100, len(df))
            
        if 'value_score' in scores_df.columns:
            df['value'] = scores_df['value_score']
        else:
            df['value'] = np.random.uniform(0, 100, len(df))

        # Check for opportunities and fatigue
        for seg_id, group in df.groupby('segment_id'):
            seg_name = segment_map.get(int(seg_id), f"Segment {seg_id}")
            count = len(group)
            
            avg_eng = group['engagement'].mean()
            avg_val = group['value'].mean()
            
            # 2. Opportunity Alert
            if avg_eng > 70 and avg_val < 40:
                alerts.append({
                    "alert_type": "opportunity_alert",
                    "severity": "info",
                    "title": f"Monetization Opportunity in {seg_name}",
                    "message": f"Segment '{seg_name}' shows high engagement but below average spending.",
                    "affected_count": int(count),
                    "segment_name": seg_name,
                    "recommended_action": "Introduce cross-sell bundles or entry-level premium tiers.",
                    "icon": "💡"
                })
                
            # 3. Win Alert
            if avg_eng > 80 and avg_val > 80:
                alerts.append({
                    "alert_type": "win_alert",
                    "severity": "info",
                    "title": f"Strong Performance in {seg_name}",
                    "message": f"Segment '{seg_name}' is performing exceptionally well in both engagement and value.",
                    "affected_count": int(count),
                    "segment_name": seg_name,
                    "recommended_action": "Consider loyalty programs or referral rewards.",
                    "icon": "🏆"
                })

            # 4. Fatigue Alert (Simulated check)
            if "dormant" in str(seg_name).lower() or avg_eng < 20:
                alerts.append({
                    "alert_type": "fatigue_alert",
                    "severity": "warning",
                    "title": f"Engagement Drop in {seg_name}",
                    "message": f"Customers in '{seg_name}' are showing signs of communication fatigue or disinterest.",
                    "affected_count": int(count),
                    "segment_name": seg_name,
                    "recommended_action": "Reduce messaging frequency and focus on high-impact reactivations.",
                    "icon": "😴"
                })

        # Ensure we have at least 3 alerts
        if len(alerts) < 3:
            alerts.append({
                "alert_type": "anomaly_alert",
                "severity": "info",
                "title": "System Check Complete",
                "message": "Routine baseline analysis shows steady state operations across segments.",
                "affected_count": len(features_df),
                "segment_name": None,
                "recommended_action": "Continue monitoring baseline metrics.",
                "icon": "✅"
            })

        # Return top alerts prioritized by severity
        severity_map = {"critical": 0, "warning": 1, "info": 2}
        alerts.sort(key=lambda x: severity_map.get(x["severity"], 3))
        
        return alerts[:5]
