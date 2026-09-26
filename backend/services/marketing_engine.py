from typing import List, Dict, Any
import pandas as pd

class MarketingEngine:
    """
    Engine to generate marketing strategies, actions, and compute fatigue indexes for different segments.
    """

    def generate_actions(self, profiles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate targeted marketing strategies and campaigns for each segment based on their profile.
        """
        actions = []
        
        for profile in profiles:
            segment_id = profile.get("segment_id", 0)
            segment_name = profile.get("segment_name", f"Segment {segment_id}").lower()
            
            # Default fallback strategy
            strategy = "retention"
            channel = ["email"]
            offer = "standard_newsletter"
            frequency = "weekly"
            objective = "maintain_engagement"
            priority = "medium"
            messaging_tone = "informative"
            rationale = "Standard communication to keep the brand top of mind."

            # Heuristics based on segment characteristics
            if "churn" in segment_name or "risk" in segment_name:
                strategy = "retention"
                channel = ["email", "push"]
                offer = "loyalty_rewards"
                frequency = "biweekly"
                objective = "reduce_churn"
                priority = "high"
                messaging_tone = "urgent"
                rationale = "High churn risk requires immediate intervention via high-visibility channels."
                
            elif "loyal" in segment_name or "high value" in segment_name:
                strategy = "upselling"
                channel = ["email"]
                offer = "premium_membership"
                frequency = "monthly"
                objective = "increase_aov"
                priority = "medium"
                messaging_tone = "exclusive"
                rationale = "Loyal customers respond well to exclusive offers and premium tiers without needing high frequency."
                
            elif "engagement" in segment_name and "low spend" in segment_name:
                strategy = "cross-sell"
                channel = ["push", "email"]
                offer = "bundle"
                frequency = "weekly"
                objective = "increase_aov"
                priority = "medium"
                messaging_tone = "friendly"
                rationale = "Highly engaged users just need the right product mix to convert better."
                
            elif "discount" in segment_name or "sensitive" in segment_name:
                strategy = "strategic_discounting"
                channel = ["email", "sms"]
                offer = "personalized_discount"
                frequency = "weekly"
                objective = "increase_frequency"
                priority = "medium"
                messaging_tone = "reward-focused"
                rationale = "Price-sensitive segments need direct financial incentives to convert."
                
            elif "new" in segment_name or "onboard" in segment_name:
                strategy = "acquisition"
                channel = ["email", "push"]
                offer = "welcome_discount"
                frequency = "2x_week"
                objective = "increase_retention"
                priority = "high"
                messaging_tone = "educational"
                rationale = "New users need guidance and a strong welcome incentive to form a habit."
                
            elif "dormant" in segment_name or "inactive" in segment_name:
                strategy = "reactivation"
                channel = ["email", "sms", "paid_ads"]
                offer = "big_discount"
                frequency = "monthly"
                objective = "reactivate"
                priority = "high"
                messaging_tone = "urgent"
                rationale = "Dormant users require aggressive omnichannel re-engagement campaigns."
                
            elif "frequent" in segment_name or "small" in segment_name:
                strategy = "aov_increase"
                channel = ["push", "app"]
                offer = "free_shipping_threshold"
                frequency = "daily"
                objective = "increase_aov"
                priority = "low"
                messaging_tone = "friendly"
                rationale = "Frequent buyers can be nudged to spend slightly more per order with thresholds."

            actions.append({
                "segment_id": segment_id,
                "segment_name": profile.get("segment_name", f"Segment {segment_id}"),
                "strategy": strategy,
                "channel": channel,
                "offer": offer,
                "frequency": frequency,
                "objective": objective,
                "priority": priority,
                "messaging_tone": messaging_tone,
                "rationale": rationale
            })
            
        return actions

    def get_marketing_fatigue_index(self, features_df: pd.DataFrame, profiles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Compute fatigue index for segments based on communication volume and engagement rates.
        """
        fatigue_results = []
        
        for profile in profiles:
            segment_id = profile.get("segment_id", 0)
            
            # Using heuristics to simulate fatigue index calculation based on typical features
            # In a real scenario, this would use features_df grouped by segment labels
            
            # Simulated base fatigue calculation
            fatigue_index = 50.0  # Base neutral fatigue
            
            # Mock adjustments based on segment names indicating fatigue
            segment_name = profile.get("segment_name", "").lower()
            if "dormant" in segment_name or "churn" in segment_name:
                fatigue_index += 30  # Higher fatigue for unengaged users
            elif "loyal" in segment_name or "engaged" in segment_name:
                fatigue_index -= 20  # Lower fatigue for highly engaged users
                
            # Cap between 0 and 100
            fatigue_index = max(0.0, min(100.0, fatigue_index))
            
            risk_level = "low"
            recommended_adjustment = "Maintain current frequency"
            
            if fatigue_index >= 75:
                risk_level = "high"
                recommended_adjustment = "Reduce communication frequency by 50% and focus on high-value offers."
            elif fatigue_index >= 50:
                risk_level = "medium"
                recommended_adjustment = "Monitor open rates closely and consider diversifying channels."
                
            fatigue_results.append({
                "segment_id": segment_id,
                "fatigue_index": round(fatigue_index, 2),
                "risk_level": risk_level,
                "recommended_adjustment": recommended_adjustment
            })
            
        return fatigue_results
