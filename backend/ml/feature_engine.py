import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Tuple, Any

class FeatureEngine:
    """
    Automatic behavioral feature engineering.
    Takes a cleaned DataFrame and generates derived behavioral features.
    """

    def __init__(self):
        self.feature_metadata: List[Dict[str, Any]] = []

    def _safe_divide(self, numerator: pd.Series, denominator: pd.Series) -> pd.Series:
        """Safely divides two pandas Series, handling division by zero."""
        return np.where(denominator == 0, 0, numerator / denominator)

    def _percentile_rank(self, series: pd.Series) -> pd.Series:
        """Calculates the percentile rank (0-100) of a pandas Series."""
        return series.rank(pct=True) * 100

    def engineer_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
        """
        Generates 30+ derived behavioral features from a cleaned DataFrame.
        """
        # Create a copy to avoid SettingWithCopyWarning
        out_df = df.copy()
        
        # Ensure we have date types if possible
        if 'last_purchase_date' in out_df.columns:
            out_df['last_purchase_date'] = pd.to_datetime(out_df['last_purchase_date'], errors='coerce')
        if 'first_purchase_date' in out_df.columns:
            out_df['first_purchase_date'] = pd.to_datetime(out_df['first_purchase_date'], errors='coerce')
            
        today = out_df['last_purchase_date'].max() if 'last_purchase_date' in out_df.columns and not out_df['last_purchase_date'].isna().all() else pd.Timestamp.today()
        if pd.isna(today):
            today = pd.Timestamp.today()

        ### Loyalty Features
        if 'first_purchase_date' in out_df.columns and 'last_purchase_date' in out_df.columns:
            out_df['customer_lifetime_days'] = (today - out_df['first_purchase_date']).dt.days.clip(lower=1)
        elif 'account_creation_date' in out_df.columns:
            out_df['account_creation_date'] = pd.to_datetime(out_df['account_creation_date'], errors='coerce')
            out_df['customer_lifetime_days'] = (today - out_df['account_creation_date']).dt.days.clip(lower=1)
        else:
            out_df['customer_lifetime_days'] = 365 # default

        out_df['customer_lifetime_days'] = out_df['customer_lifetime_days'].fillna(1)
        out_df['customer_lifetime_months'] = out_df['customer_lifetime_days'] / 30.0
        out_df['customer_lifetime_months'] = out_df['customer_lifetime_months'].replace(0, 1) # Prevent division by zero

        # RFM Features
        if 'last_purchase_date' in out_df.columns:
            out_df['recency_days'] = (today - out_df['last_purchase_date']).dt.days
            out_df['recency_days'] = out_df['recency_days'].fillna(out_df['customer_lifetime_days'])
        else:
            out_df['recency_days'] = 0

        order_count = out_df['order_count'] if 'order_count' in out_df.columns else pd.Series(np.ones(len(out_df)), index=out_df.index)
        out_df['purchase_frequency'] = self._safe_divide(order_count, out_df['customer_lifetime_months'])
        
        monetary = out_df['total_spending'] if 'total_spending' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        out_df['monetary_value'] = monetary

        r_score = self._percentile_rank(-out_df['recency_days']) # lower recency is better, so rank negative
        f_score = self._percentile_rank(out_df['purchase_frequency'])
        m_score = self._percentile_rank(out_df['monetary_value'])
        out_df['rfm_score'] = (r_score + f_score + m_score) / 3.0

        ### Engagement Features
        metrics = ['email_opens', 'email_clicks', 'ad_interactions', 'website_visits', 'app_sessions']
        total_engagement = pd.Series(np.zeros(len(out_df)), index=out_df.index)
        for m in metrics:
            if m in out_df.columns:
                total_engagement += out_df[m].fillna(0)
                
        out_df['engagement_frequency'] = self._safe_divide(total_engagement, out_df['customer_lifetime_months'])
        
        sessions = out_df['session_count'] if 'session_count' in out_df.columns else out_df['website_visits'] if 'website_visits' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        out_df['session_frequency'] = self._safe_divide(sessions, out_df['customer_lifetime_months'])

        email_opens = out_df['email_opens'].fillna(0) if 'email_opens' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        email_clicks = out_df['email_clicks'].fillna(0) if 'email_clicks' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        out_df['email_engagement_rate'] = self._safe_divide(email_clicks, email_opens)

        ad_interactions = out_df['ad_interactions'].fillna(0) if 'ad_interactions' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        website_visits = out_df['website_visits'].fillna(0) if 'website_visits' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        out_df['ad_interaction_rate'] = self._safe_divide(ad_interactions, website_visits)

        out_df['website_activity'] = self._safe_divide(website_visits, out_df['customer_lifetime_months'])
        
        app_sessions = out_df['app_sessions'].fillna(0) if 'app_sessions' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        out_df['app_activity'] = self._safe_divide(app_sessions, out_df['customer_lifetime_months'])

        eng_scores = [self._percentile_rank(out_df[col]) for col in ['engagement_frequency', 'session_frequency', 'email_engagement_rate', 'ad_interaction_rate', 'website_activity', 'app_activity'] if col in out_df.columns]
        if eng_scores:
            out_df['digital_engagement_score'] = sum(eng_scores) / len(eng_scores)
        else:
            out_df['digital_engagement_score'] = 0

        ### Purchase Behavior
        out_df['avg_order_value'] = self._safe_divide(out_df['monetary_value'], order_count)
        out_df['purchase_interval_days'] = self._safe_divide(out_df['customer_lifetime_days'], order_count)
        
        if 'product_category' in out_df.columns:
            # Assuming product_category could be string or list
            out_df['product_diversity'] = out_df.groupby('customer_id')['product_category'].transform('nunique') if 'customer_id' in out_df.columns else 1
        elif 'product_usage_frequency' in out_df.columns:
            out_df['product_diversity'] = out_df['product_usage_frequency']
        else:
            out_df['product_diversity'] = 0

        coupon_usage = out_df['coupon_usage'].fillna(0) if 'coupon_usage' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        discount_usage = out_df['discount_usage'].fillna(0) if 'discount_usage' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        out_df['discount_dependency'] = self._safe_divide(coupon_usage + discount_usage, order_count)

        out_df['repeat_purchase_rate'] = np.where(order_count > 1, 1, 0) * out_df['purchase_frequency']
        
        returns = out_df['returns_refunds'].fillna(0) if 'returns_refunds' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        out_df['return_rate'] = self._safe_divide(returns, order_count)

        cart_abandonment = out_df['cart_abandonment'].fillna(0) if 'cart_abandonment' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        cart_additions = out_df['cart_additions'].fillna(0) if 'cart_additions' in out_df.columns else (cart_abandonment + order_count)
        out_df['cart_abandonment_rate'] = self._safe_divide(cart_abandonment, cart_additions)
        out_df['cart_conversion_rate'] = self._safe_divide(order_count, cart_additions)
        
        out_df['spending_per_visit'] = self._safe_divide(out_df['monetary_value'], website_visits)

        ### Loyalty Features (continued)
        # purchase_consistency proxy if we don't have exact transaction dates
        out_df['purchase_consistency'] = np.where(order_count > 1, 1 / (1 + out_df['purchase_interval_days'].std()), 0)
        
        sub_duration = out_df['subscription_duration_months'].fillna(0) if 'subscription_duration_months' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        sub_status = out_df['subscription_status'].fillna('none') if 'subscription_status' in out_df.columns else pd.Series(['none']*len(out_df), index=out_df.index)
        sub_mult = sub_status.map({'active': 2, 'inactive': 1, 'none': 0}).fillna(0)
        out_df['subscription_loyalty_score'] = sub_duration * sub_mult

        loyalty_scores = [self._percentile_rank(out_df[c]) for c in ['customer_lifetime_days', 'repeat_purchase_rate', 'purchase_consistency', 'subscription_loyalty_score'] if c in out_df.columns]
        out_df['loyalty_index'] = sum(loyalty_scores) / len(loyalty_scores) if loyalty_scores else 0

        ### Churn Signals
        out_df['days_since_last_activity'] = out_df['recency_days']
        out_df['inactivity_ratio'] = self._safe_divide(out_df['recency_days'], out_df['customer_lifetime_days'])
        
        # Proxy for purchase momentum (recent purchases vs historical average)
        out_df['purchase_momentum'] = self._safe_divide(1, out_df['recency_days'] + 1) * out_df['purchase_frequency']
        
        out_df['engagement_decline_signal'] = self._percentile_rank(out_df['recency_days']) - self._percentile_rank(out_df['digital_engagement_score'])
        
        support = out_df['customer_support_interactions'].fillna(0) if 'customer_support_interactions' in out_df.columns else pd.Series(np.zeros(len(out_df)), index=out_df.index)
        out_df['support_escalation_rate'] = self._safe_divide(support, order_count)

        ### Derived Composites
        out_df['value_engagement_ratio'] = self._safe_divide(self._percentile_rank(out_df['monetary_value']), self._percentile_rank(out_df['digital_engagement_score']))
        out_df['monetization_efficiency'] = self._safe_divide(out_df['monetary_value'], sessions)

        # Generate Metadata
        feature_columns = [
            'recency_days', 'purchase_frequency', 'monetary_value', 'rfm_score',
            'engagement_frequency', 'session_frequency', 'email_engagement_rate', 
            'ad_interaction_rate', 'website_activity', 'app_activity', 'digital_engagement_score',
            'avg_order_value', 'purchase_interval_days', 'product_diversity', 'discount_dependency',
            'repeat_purchase_rate', 'return_rate', 'cart_abandonment_rate', 'cart_conversion_rate',
            'spending_per_visit', 'customer_lifetime_days', 'customer_lifetime_months',
            'purchase_consistency', 'subscription_loyalty_score', 'loyalty_index',
            'days_since_last_activity', 'inactivity_ratio', 'purchase_momentum',
            'engagement_decline_signal', 'support_escalation_rate', 'value_engagement_ratio',
            'monetization_efficiency'
        ]

        self.feature_metadata = []
        for col in feature_columns:
            if col in out_df.columns:
                self.feature_metadata.append({
                    'name': col,
                    'description': f'Auto-generated feature: {col}',
                    'category': 'Behavioral',
                    'formula': 'Derived internally',
                    'min': float(out_df[col].min()),
                    'max': float(out_df[col].max()),
                    'mean': float(out_df[col].mean()),
                    'std': float(out_df[col].std())
                })
                
        # Keep customer_id if exists and all generated features
        keep_cols = ['customer_id'] if 'customer_id' in out_df.columns else []
        keep_cols.extend([c for c in feature_columns if c in out_df.columns])
        
        # Also keep any original columns if they were not overwritten and might be useful, 
        # but to strictly follow the prompt, returning original customer_id + new features.
        
        return out_df[keep_cols], self.feature_metadata

    def get_feature_store(self) -> List[Dict[str, Any]]:
        """Returns the feature metadata list with distribution stats."""
        return self.feature_metadata
