import pandas as pd
import numpy as np
from scipy.stats import percentileofscore
from sklearn.decomposition import PCA
from typing import Dict, Any

class ScoringEngine:
    """
    Customer behavior scoring engine.
    Takes the feature-engineered DataFrame and adds 7 sub-scores + 1 composite score.
    """
    
    def _percentile(self, series: pd.Series) -> pd.Series:
        """Calculates percentile rank 0-100 handling NaNs."""
        clean_series = series.dropna()
        if clean_series.empty:
            return pd.Series(0, index=series.index)
        
        # Calculate percentiles and map back
        ranks = clean_series.rank(pct=True) * 100
        result = pd.Series(np.nan, index=series.index)
        result.loc[ranks.index] = ranks
        return result.fillna(0)

    def calculate_scores(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Takes the feature-engineered DataFrame and adds scores.
        """
        out_df = df.copy()
        
        # 1. engagement_score
        if 'digital_engagement_score' in out_df.columns:
            engagement_base = out_df['digital_engagement_score']
        else:
            cols = [c for c in ['session_frequency', 'email_engagement_rate', 'ad_interaction_rate', 'website_activity', 'app_activity'] if c in out_df.columns]
            engagement_base = out_df[cols].sum(axis=1) if cols else pd.Series(0, index=out_df.index)
        out_df['engagement_score'] = self._percentile(engagement_base)
        
        # 2. loyalty_score
        if 'loyalty_index' in out_df.columns:
            loyalty_base = out_df['loyalty_index']
        else:
            cols = [c for c in ['customer_lifetime_days', 'purchase_consistency', 'subscription_loyalty_score', 'repeat_purchase_rate'] if c in out_df.columns]
            loyalty_base = out_df[cols].sum(axis=1) if cols else pd.Series(0, index=out_df.index)
        out_df['loyalty_score'] = self._percentile(loyalty_base)
        
        # 3. value_score
        cols = [c for c in ['monetary_value', 'avg_order_value', 'customer_lifetime_value'] if c in out_df.columns]
        value_base = out_df[cols].sum(axis=1) if cols else pd.Series(0, index=out_df.index)
        out_df['value_score'] = self._percentile(value_base)
        
        # 4. purchase_intent_score
        intent_base = pd.Series(0, index=out_df.index)
        if 'cart_conversion_rate' in out_df.columns:
            intent_base += out_df['cart_conversion_rate']
        if 'recency_days' in out_df.columns:
            # lower recency = higher intent
            intent_base += self._percentile(-out_df['recency_days']) / 100.0
        out_df['purchase_intent_score'] = self._percentile(intent_base)
        
        # 5. discount_sensitivity_score
        discount_base = pd.Series(0, index=out_df.index)
        if 'discount_dependency' in out_df.columns:
            discount_base += out_df['discount_dependency']
        if 'coupon_usage_ratio' in out_df.columns:
            discount_base += out_df['coupon_usage_ratio']
        out_df['discount_sensitivity_score'] = self._percentile(discount_base)
        
        # 6. churn_risk_score
        churn_base = pd.Series(0, index=out_df.index)
        if 'inactivity_ratio' in out_df.columns:
            churn_base += out_df['inactivity_ratio']
        if 'engagement_decline_signal' in out_df.columns:
            churn_base += out_df['engagement_decline_signal']
        if 'support_escalation_rate' in out_df.columns:
            churn_base += out_df['support_escalation_rate']
        out_df['churn_risk_score'] = self._percentile(churn_base)
        
        # 7. product_affinity_score
        affinity_base = pd.Series(0, index=out_df.index)
        cols = [c for c in ['product_diversity', 'product_ratings', 'review_count', 'product_usage_frequency'] if c in out_df.columns]
        if cols:
            affinity_base = out_df[cols].sum(axis=1)
        out_df['product_affinity_score'] = self._percentile(affinity_base)
        
        # Composite Score using PCA
        score_cols = [
            'engagement_score', 'loyalty_score', 'value_score', 
            'purchase_intent_score', 'discount_sensitivity_score', 
            'churn_risk_score', 'product_affinity_score'
        ]
        
        X = out_df[score_cols].fillna(0)
        if not X.empty and X.shape[0] > 1:
            pca = PCA(n_components=1)
            # Standardize before PCA
            X_scaled = (X - X.mean()) / (X.std() + 1e-8)
            principal_components = pca.fit_transform(X_scaled)
            
            # The composite score could have arbitrary scale, so normalize it to 0-100
            comp_min = principal_components.min()
            comp_max = principal_components.max()
            
            if comp_max - comp_min > 0:
                composite = (principal_components - comp_min) / (comp_max - comp_min) * 100
            else:
                composite = np.zeros_like(principal_components)
                
            # If the first PC is negatively correlated with positive metrics (like value_score), flip it
            # We check the sign of the loading for value_score (index 2)
            if pca.components_[0][2] < 0:
                composite = 100 - composite
                
            out_df['composite_score'] = composite.flatten()
        else:
            out_df['composite_score'] = 0.0
            
        # Clip all scores to 0-100
        for col in score_cols + ['composite_score']:
            out_df[col] = out_df[col].clip(0, 100)
            
        return out_df

    def get_score_explanations(self, customer_id: str, scores_df: pd.DataFrame, features_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Explain each score by listing top contributing features and values for a customer.
        """
        if 'customer_id' not in scores_df.columns or 'customer_id' not in features_df.columns:
            return {"error": "customer_id column not found"}
            
        cust_scores = scores_df[scores_df['customer_id'] == customer_id]
        cust_features = features_df[features_df['customer_id'] == customer_id]
        
        if cust_scores.empty or cust_features.empty:
            return {"error": "Customer not found"}
            
        cust_scores = cust_scores.iloc[0]
        cust_features = cust_features.iloc[0]
        
        # A heuristic mapping of scores to their primary features for explanation
        score_feature_map = {
            'engagement_score': ['digital_engagement_score', 'session_frequency', 'email_engagement_rate', 'website_activity'],
            'loyalty_score': ['loyalty_index', 'customer_lifetime_days', 'purchase_consistency', 'repeat_purchase_rate'],
            'value_score': ['monetary_value', 'avg_order_value', 'total_spending'],
            'purchase_intent_score': ['cart_conversion_rate', 'recency_days'],
            'discount_sensitivity_score': ['discount_dependency', 'coupon_usage'],
            'churn_risk_score': ['inactivity_ratio', 'engagement_decline_signal', 'support_escalation_rate'],
            'product_affinity_score': ['product_diversity', 'product_usage_frequency']
        }
        
        explanations = {}
        for score_name, feature_list in score_feature_map.items():
            if score_name in cust_scores:
                score_val = cust_scores[score_name]
                top_features = []
                for feat in feature_list:
                    if feat in cust_features:
                        top_features.append({"feature": feat, "value": float(cust_features[feat])})
                        if len(top_features) == 3:
                            break
                explanations[score_name] = {
                    "score": float(score_val),
                    "top_contributors": top_features
                }
                
        if 'composite_score' in cust_scores:
            explanations['composite_score'] = {
                "score": float(cust_scores['composite_score']),
                "note": "Derived via PCA across all sub-scores."
            }
            
        return explanations

    def get_score_summary(self, scores_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Return summary stats for each score.
        """
        score_cols = [
            'engagement_score', 'loyalty_score', 'value_score', 
            'purchase_intent_score', 'discount_sensitivity_score', 
            'churn_risk_score', 'product_affinity_score', 'composite_score'
        ]
        
        summary = {}
        for col in score_cols:
            if col in scores_df.columns:
                series = scores_df[col].dropna()
                if not series.empty:
                    summary[col] = {
                        "mean": float(series.mean()),
                        "median": float(series.median()),
                        "std": float(series.std()),
                        "quartiles": {
                            "25%": float(series.quantile(0.25)),
                            "50%": float(series.quantile(0.50)),
                            "75%": float(series.quantile(0.75))
                        }
                    }
        return summary
