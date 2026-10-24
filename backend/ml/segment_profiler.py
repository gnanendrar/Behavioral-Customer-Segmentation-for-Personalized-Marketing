import numpy as np
import pandas as pd
from typing import List, Dict, Any

class SegmentProfiler:
    def profile_segments(self, features_df: pd.DataFrame, scores_df: pd.DataFrame, labels: np.ndarray) -> List[Dict[str, Any]]:
        """
        Generate comprehensive profiles for each segment.
        """
        profiles = []
        unique_labels = np.unique(labels)
        
        # Combine features and scores for profiling
        df = scores_df.copy()
        df['segment_label'] = labels
        
        total_customers = len(df)
        revenue_col = 'monetary_value' if 'monetary_value' in df.columns else ('total_spending' if 'total_spending' in df.columns else None)
        total_revenue = df[revenue_col].sum() if revenue_col else 1.0
        if total_revenue == 0:
            total_revenue = 1.0
            
        numeric_cols = df.select_dtypes(include=[np.number]).columns.drop('segment_label', errors='ignore')
        pop_mean = df[numeric_cols].mean()
        pop_std = df[numeric_cols].std()
        
        pop_std = pop_std.replace(0, 1)

        for label in unique_labels:
            if label == -1:
                continue
                
            segment_df = df[df['segment_label'] == label]
            
            customer_count = len(segment_df)
            percentage = (customer_count / total_customers) * 100
            
            segment_revenue = segment_df[revenue_col].sum() if revenue_col else 0.0
            revenue_contribution = (segment_revenue / total_revenue) * 100 if total_revenue > 0 else 0.0
            
            feature_means = segment_df[numeric_cols].mean()
            feature_zscores = ((feature_means - pop_mean) / pop_std).to_dict()
            
            segment_name = self._generate_segment_name(feature_zscores, int(label))
            
            dominant_categories = []
            category_cols = [c for c in df.columns if c.startswith('category_')]
            if category_cols:
                cat_means = segment_df[category_cols].mean().sort_values(ascending=False)
                dominant_categories = cat_means.head(3).index.str.replace('category_', '').tolist()
                
            key_characteristics = []
            sorted_zscores = sorted(feature_zscores.items(), key=lambda x: abs(x[1]) if not pd.isna(x[1]) else 0, reverse=True)
            for feature, z in sorted_zscores[:5]:
                if pd.isna(z):
                    continue
                direction = "High" if z > 0 else "Low"
                key_characteristics.append(f"{direction} {feature.replace('_', ' ').title()}")
            
            profile = {
                'segment_id': int(label),
                'segment_name': segment_name,
                'customer_count': int(customer_count),
                'percentage': float(percentage),
                'revenue_contribution': float(revenue_contribution),
                'avg_value_score': float(feature_means.get('value_score', 0.0)),
                'avg_engagement_score': float(feature_means.get('engagement_score', 0.0)),
                'avg_loyalty_score': float(feature_means.get('loyalty_score', 0.0)),
                'avg_churn_risk': float(feature_means.get('churn_risk_score', 0.0)),
                'avg_discount_sensitivity': float(feature_means.get('discount_sensitivity_score', 0.0)),
                'avg_purchase_frequency': float(feature_means.get('purchase_frequency', 0.0)),
                'avg_order_value': float(feature_means.get('avg_order_value', 0.0)),
                'avg_customer_lifetime_days': float(feature_means.get('customer_lifetime_days', 0.0)),
                'dominant_categories': dominant_categories,
                'key_characteristics': key_characteristics,
                'feature_means': feature_means.fillna(0.0).to_dict(),
                'feature_zscores': {k: float(v) if not pd.isna(v) else 0.0 for k, v in feature_zscores.items()},
                'behavioral_summary': self.get_behavioral_summary(feature_zscores, segment_name)
            }
            
            profile['revenue'] = float(segment_revenue)
            profiles.append(profile)

        self._make_names_unique(profiles)
        self.profiles = profiles
        return profiles

    def _make_names_unique(self, profiles: List[Dict[str, Any]]) -> None:
        """Rule-based naming can map two clusters to the same archetype, and clusters
        matching no rule get a generic name. Give every segment a distinct, descriptive name."""
        for p in profiles:
            if p['segment_name'].startswith('Behavioral Segment'):
                # describe the cluster by its value / engagement / risk position (scores are 0-100 percentiles)
                v, e, c = p.get('avg_value_score', 50), p.get('avg_engagement_score', 50), p.get('avg_churn_risk', 50)
                value = 'High-Value' if v >= 65 else ('Mid-Value' if v >= 35 else 'Low-Value')
                eng = 'Highly Engaged' if e >= 65 else ('Occasional' if e >= 35 else 'Passive')
                risk = 'At-Risk ' if c >= 65 else ''
                p['segment_name'] = f"{risk}{value} {eng} Shoppers"

        by_name: Dict[str, List[Dict[str, Any]]] = {}
        for p in profiles:
            by_name.setdefault(p['segment_name'], []).append(p)
        for name, group in by_name.items():
            if len(group) < 2:
                continue
            # suffix by the score dimension that separates the duplicates most
            dims = [('avg_value_score', 'Value'), ('avg_engagement_score', 'Engagement'),
                    ('avg_loyalty_score', 'Loyalty'), ('avg_churn_risk', 'Churn Risk'),
                    ('avg_discount_sensitivity', 'Discount Use')]
            spread = {d: max(p.get(d, 0) for p in group) - min(p.get(d, 0) for p in group) for d, _ in dims}
            key, label = max(dims, key=lambda d: spread[d[0]])
            group.sort(key=lambda p: p.get(key, 0), reverse=True)
            if len(group) == 2:
                tiers = [f'Higher {label}', f'Lower {label}']
            else:
                tiers = [f'{label} Tier {i + 1}' for i in range(len(group))]
            for p, tier in zip(group, tiers):
                p['segment_name'] = f"{name} ({tier})"
        for p in profiles:
            p['behavioral_summary'] = self.get_behavioral_summary(p.get('feature_zscores', {}), p['segment_name'])

    def _generate_segment_name(self, zscores: Dict[str, float], label: int) -> str:
        """
        Auto-generate segment name based on z-scores.
        """
        val = zscores.get('value_score', 0)
        eng = zscores.get('engagement_score', 0)
        loy = zscores.get('loyalty_score', 0)
        churn = zscores.get('churn_risk_score', 0)
        disc = zscores.get('discount_sensitivity_score', 0)
        rec = zscores.get('recency_days', 0)
        freq = zscores.get('purchase_frequency', 0)
        aov = zscores.get('avg_order_value', 0)
        lifetime = zscores.get('customer_lifetime_days', 0)
        
        # handle nan
        val = val if not pd.isna(val) else 0.0
        eng = eng if not pd.isna(eng) else 0.0
        loy = loy if not pd.isna(loy) else 0.0
        churn = churn if not pd.isna(churn) else 0.0
        disc = disc if not pd.isna(disc) else 0.0
        rec = rec if not pd.isna(rec) else 0.0
        freq = freq if not pd.isna(freq) else 0.0
        aov = aov if not pd.isna(aov) else 0.0
        lifetime = lifetime if not pd.isna(lifetime) else 0.0

        if val > 0.5 and loy > 0.5 and churn < -0.5:
            return 'High-Value Loyalists'
            
        if val > 0.5 and churn > 0.5:
            return 'At-Risk VIP Customers'
            
        if eng > 0.5 and val < -0.5:
            return 'Engaged Low-Spenders'
            
        if disc > 0.5 and -0.5 <= val <= 0.5:
            return 'Promotion-Driven Buyers'
            
        if rec < -0.5 and freq < -0.5 and lifetime < -0.5:
            return 'New & Curious Customers'
            
        if rec > 0.5 and eng < -0.5:
            return 'Dormant Customers'
            
        if churn > 0.5 and eng < -0.5:
            return 'Churn-Prone Customers'
            
        if eng > 0.5 and -0.5 <= val <= 0.5:
            return 'Emerging High-Potential'
            
        if freq > 0.5 and aov < -0.5:
            return 'Frequent Small Buyers'
            
        if eng > 0.5 and val > 0.5 and disc < -0.5:
            return 'Premium Enthusiasts'

        return f'Behavioral Segment {label}'

    def get_segment_comparison(self, segment_ids: List[int]) -> Dict[str, Any]:
        """
        Compare multiple segments side-by-side.
        """
        if not hasattr(self, 'profiles'):
            return {}
            
        selected_profiles = [p for p in self.profiles if p['segment_id'] in segment_ids]
        
        if not selected_profiles:
            return {}
            
        comparison_matrix = {}
        keys_to_compare = [
            'customer_count', 'percentage', 'revenue_contribution', 
            'avg_value_score', 'avg_engagement_score', 'avg_loyalty_score',
            'avg_churn_risk', 'avg_discount_sensitivity', 'avg_purchase_frequency',
            'avg_order_value', 'avg_customer_lifetime_days'
        ]
        
        for key in keys_to_compare:
            comparison_matrix[key] = {
                str(p['segment_id']): p[key] for p in selected_profiles
            }
            
        return {
            'segments': [p['segment_name'] for p in selected_profiles],
            'segment_ids': [p['segment_id'] for p in selected_profiles],
            'metrics': comparison_matrix
        }

    def get_behavioral_summary(self, zscores: Dict[str, float] = None, segment_name: str = "", segment_id: int = None) -> str:
        """
        Generate a human-readable paragraph explaining why this segment exists.
        """
        if zscores is None and segment_id is not None and hasattr(self, 'profiles'):
            profile = next((p for p in self.profiles if p['segment_id'] == segment_id), None)
            if profile:
                zscores = profile['feature_zscores']
                segment_name = profile['segment_name']
                
        if not zscores:
            return "No data available for this segment."

        high_traits = [k.replace('_', ' ') for k, v in zscores.items() if not pd.isna(v) and v > 0.8]
        low_traits = [k.replace('_', ' ') for k, v in zscores.items() if not pd.isna(v) and v < -0.8]
        
        summary = f"The '{segment_name}' segment represents a distinct customer group with unique behavioral patterns. "
        
        if high_traits:
            summary += f"They are primarily characterized by exceptionally high {', '.join(high_traits[:3])}. "
        
        if low_traits:
            summary += f"Conversely, they exhibit remarkably low {', '.join(low_traits[:3])}. "
            
        summary += "This indicates a specialized engagement style that requires targeted marketing strategies to maximize their lifetime value."
        
        return summary
