from fastapi import APIRouter, HTTPException, Query
import numpy as np
import pandas as pd
from typing import Optional
from backend.main import get_state
from backend.utils.customer_dna import CustomerDNA
from backend.ml.scoring import ScoringEngine

router = APIRouter()

@router.get("/")
def get_customers(
    segment_id: Optional[int] = None,
    min_value: Optional[float] = None,
    max_churn: Optional[float] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 50
):
    state = get_state()
    if state.get('features_df') is None or state.get('scores_df') is None or state.get('labels') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    try:
        features_df = state['features_df']
        scores_df = state['scores_df']
        labels = state['labels']
        
        combined = pd.concat([features_df, scores_df], axis=1)
        combined['segment_id'] = labels
        combined = combined.loc[:,~combined.columns.duplicated()]
        
        if 'customer_id' not in combined.columns:
            combined['customer_id'] = combined.index
            
        if segment_id is not None:
            combined = combined[combined['segment_id'] == segment_id]
            
        if min_value is not None and 'clv_score' in combined.columns:
            combined = combined[combined['clv_score'] >= min_value]
            
        if max_churn is not None and 'churn_risk_score' in combined.columns:
            combined = combined[combined['churn_risk_score'] <= max_churn]
            
        if search:
            combined = combined[combined['customer_id'].astype(str).str.contains(search, case=False)]
            
        total_items = len(combined)
        
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        page_df = combined.iloc[start_idx:end_idx].replace([np.inf, -np.inf], np.nan).fillna(0)
        
        return {
            "items": page_df.to_dict(orient='records'),
            "total": total_items,
            "page": page,
            "page_size": page_size,
            "pages": (total_items + page_size - 1) // page_size
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
def search_customers(q: str = Query(...)):
    state = get_state()
    if state.get('features_df') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    try:
        features_df = state['features_df']
        
        if 'customer_id' not in features_df.columns:
            features_df_temp = features_df.copy()
            features_df_temp['customer_id'] = features_df_temp.index
        else:
            features_df_temp = features_df
            
        matches = features_df_temp[features_df_temp['customer_id'].astype(str).str.contains(q, case=False)]
        
        safe_matches = matches.head(50).replace([np.inf, -np.inf], np.nan).fillna(0)
        
        return safe_matches.to_dict(orient='records')
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{customer_id}")
def get_customer(customer_id: str):
    state = get_state()
    if state.get('features_df') is None or state.get('scores_df') is None or state.get('labels') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    try:
        features_df = state['features_df']
        scores_df = state['scores_df']
        labels = state['labels']
        profiles = state.get('profiles', [])
        
        customer_idx = None
        if 'customer_id' in features_df.columns:
            matches = features_df.index[features_df['customer_id'].astype(str) == customer_id]
            if len(matches) > 0:
                customer_idx = matches[0]
        else:
            try:
                customer_idx = int(customer_id)
                if customer_idx not in features_df.index:
                    customer_idx = None
            except ValueError:
                pass
                
        if customer_idx is None:
            raise HTTPException(status_code=404, detail="Customer not found")
            
        customer_features = features_df.loc[customer_idx].replace([np.inf, -np.inf], np.nan).fillna(0).to_dict()
        customer_scores = scores_df.loc[customer_idx].replace([np.inf, -np.inf], np.nan).fillna(0).to_dict()
        
        segment_id = int(labels[features_df.index.get_loc(customer_idx)] if type(labels) == np.ndarray else labels.loc[customer_idx])
        
        segment_name = f"Segment {segment_id}"
        for profile in profiles:
            if profile.get('segment_id') == segment_id:
                segment_name = profile.get('segment_name', segment_name)
                break
                
        scoring_engine = ScoringEngine()
        explanations = scoring_engine.explain_scores(customer_features) if hasattr(scoring_engine, 'explain_scores') else {}
        
        dna_engine = CustomerDNA()
        dna = dna_engine.generate_dna(customer_features) if hasattr(dna_engine, 'generate_dna') else {}
        
        # Mock behavioral changes
        behavioral_changes = {
            "spending_trend": "increasing",
            "engagement_trend": "stable"
        }
        
        return {
            "customer_id": customer_id,
            "segment_id": segment_id,
            "segment_name": segment_name,
            "features": customer_features,
            "scores": customer_scores,
            "score_explanations": explanations,
            "dna": dna,
            "behavioral_changes": behavioral_changes
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
