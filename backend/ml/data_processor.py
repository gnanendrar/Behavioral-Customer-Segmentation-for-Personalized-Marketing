import pandas as pd
import numpy as np
from fuzzywuzzy import process
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Any
import os

class DataProcessor:
    """
    Data ingestion and processing pipeline.
    """
    def __init__(self):
        self.scaler = StandardScaler()
        self.standard_columns = [
            "customer_id", "first_purchase_date", "last_purchase_date", "order_count", 
            "total_spending", "avg_order_value", "product_category", "website_visits", 
            "app_sessions", "session_count", "email_opens", "email_clicks", "ad_interactions", 
            "coupon_usage", "discount_usage", "cart_additions", "cart_abandonment", 
            "product_usage_frequency", "customer_support_interactions", "customer_lifetime_value", 
            "subscription_status", "subscription_duration_months", "returns_refunds", 
            "product_ratings", "review_count", "signup_date", "region", "referral_source"
        ]

    def load_data(self, file_path: str) -> pd.DataFrame:
        """
        Load CSV or Excel file into a pandas DataFrame.
        """
        _, ext = os.path.splitext(file_path.lower())
        if ext in ['.xls', '.xlsx']:
            return pd.read_excel(file_path)
        else:
            return pd.read_csv(file_path)

    def detect_columns(self, df: pd.DataFrame) -> Dict[str, str]:
        """
        Auto-detect column types using fuzzy matching. 
        Map user columns to standard internal names.
        """
        mapping = {}
        for col in df.columns:
            # Clean column name for matching
            clean_col = str(col).lower().replace(" ", "_").replace("-", "_")
            match, score = process.extractOne(clean_col, self.standard_columns)
            if score >= 80:
                mapping[col] = match
        return mapping

    def get_data_quality_report(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generates a data quality report.
        """
        total_rows = len(df)
        total_columns = len(df.columns)
        missing_values = df.isnull().sum().to_dict()
        missing_percentage = (df.isnull().mean() * 100).to_dict()
        duplicate_rows = int(df.duplicated().sum())
        
        numerical_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_columns = df.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()
        date_columns = df.select_dtypes(include=['datetime', 'datetimetz']).columns.tolist()
        
        # Heuristic to detect date columns if they are read as objects
        for col in categorical_columns:
            if 'date' in str(col).lower():
                date_columns.append(col)
                
        outlier_counts = {}
        for col in numerical_columns:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            outliers = ((df[col] < lower_bound) | (df[col] > upper_bound)).sum()
            outlier_counts[col] = int(outliers)
            
        total_missing = sum(missing_values.values())
        total_cells = total_rows * total_columns
        completeness_score = 100 * (1 - (total_missing / total_cells)) if total_cells > 0 else 0

        return {
            "total_rows": total_rows,
            "total_columns": total_columns,
            "missing_values_per_column": missing_values,
            "missing_percentage": missing_percentage,
            "duplicate_rows": duplicate_rows,
            "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "numerical_columns": numerical_columns,
            "categorical_columns": categorical_columns,
            "date_columns": date_columns,
            "outlier_counts": outlier_counts,
            "completeness_score": round(completeness_score, 2)
        }

    def clean_data(self, df: pd.DataFrame, column_mapping: Dict[str, str]) -> pd.DataFrame:
        """
        Clean the data: apply mapping, handle missing values, duplicates, outliers, scale, and encode.
        """
        df_clean = df.copy()
        
        # Apply column mapping
        df_clean.rename(columns=column_mapping, inplace=True)
        
        # Remove duplicates
        df_clean.drop_duplicates(inplace=True)
        
        # Re-detect column types after rename
        numerical_cols = df_clean.select_dtypes(include=[np.number]).columns.tolist()
        date_cols = [col for col in df_clean.columns if 'date' in str(col).lower()]
        categorical_cols = [col for col in df_clean.columns if col not in numerical_cols and col not in date_cols]
        
        # Forward fill function for Pandas >= 2.1 (using bfill/ffill directly to avoid deprecation warnings)
        for col in df_clean.columns:
            if col in date_cols:
                df_clean[col] = pd.to_datetime(df_clean[col], errors='coerce')
                # ffill first, then bfill for remaining
                df_clean[col] = df_clean[col].ffill().bfill()
            elif col in numerical_cols:
                df_clean[col] = df_clean[col].fillna(df_clean[col].median())
            else:
                mode_val = df_clean[col].mode()
                if not mode_val.empty:
                    df_clean[col] = df_clean[col].fillna(mode_val[0])
                else:
                    df_clean[col] = df_clean[col].fillna("Unknown")
                    
        # Cap outliers using IQR (1.5x)
        for col in numerical_cols:
            if col != 'customer_id' and not str(col).endswith('_id') and df_clean[col].nunique() > 2:
                Q1 = df_clean[col].quantile(0.25)
                Q3 = df_clean[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                df_clean[col] = np.clip(df_clean[col], lower_bound, upper_bound)
                
        # Normalize numerical columns
        cols_to_scale = [col for col in numerical_cols if col not in ['customer_id'] and not str(col).endswith('_id')]
        if cols_to_scale:
            df_clean[cols_to_scale] = self.scaler.fit_transform(df_clean[cols_to_scale])
            
        # Encode categoricals
        for col in categorical_cols:
            if col != 'customer_id':
                df_clean[col] = df_clean[col].astype(str)
                df_clean[col] = pd.Categorical(df_clean[col]).codes

        return df_clean

    def aggregate_transactions(self, df: pd.DataFrame, id_col: str) -> pd.DataFrame:
        """
        Aggregate transactional data to the customer level.
        """
        if id_col not in df.columns:
            return df
            
        numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        agg_funcs = {}
        
        for col in df.columns:
            if col == id_col:
                continue
            if col in numerical_cols:
                if any(x in str(col).lower() for x in ['spending', 'count', 'visits', 'sessions', 'additions', 'clicks', 'opens', 'usage']):
                    agg_funcs[col] = 'sum'
                else:
                    agg_funcs[col] = 'mean'
            else:
                # Get the most common value for categorical columns
                agg_funcs[col] = lambda x: x.mode()[0] if not x.mode().empty else np.nan
            
        if agg_funcs:
            return df.groupby(id_col).agg(agg_funcs).reset_index()
        return df

    def get_column_statistics(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Return statistical summaries for each column.
        """
        stats = []
        for col in df.columns:
            valid_data = df[col].dropna()
            sample_vals = valid_data.sample(min(5, len(valid_data))).tolist() if len(valid_data) > 0 else []
            
            col_stats = {
                "name": col,
                "dtype": str(df[col].dtype),
                "missing_count": int(df[col].isnull().sum()),
                "unique_count": int(df[col].nunique()),
                "sample_values": sample_vals
            }
            
            if pd.api.types.is_numeric_dtype(df[col]):
                col_stats.update({
                    "min": float(df[col].min()) if not pd.isna(df[col].min()) else None,
                    "max": float(df[col].max()) if not pd.isna(df[col].max()) else None,
                    "mean": float(df[col].mean()) if not pd.isna(df[col].mean()) else None,
                    "median": float(df[col].median()) if not pd.isna(df[col].median()) else None,
                    "std": float(df[col].std()) if not pd.isna(df[col].std()) else None,
                })
            stats.append(col_stats)
            
        return stats
