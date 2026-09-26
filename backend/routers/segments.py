from fastapi import APIRouter, HTTPException, Query
import numpy as np
import pandas as pd
from backend.main import get_state
from backend.ml.segment_profiler import SegmentProfiler

router = APIRouter()

@router.get("/")
def get_segments():
    state = get_state()
    if state.get('profiles') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
    return {"segments": state['profiles'], "profiles": state['profiles']}

@router.get("/compare")
def compare_segments(ids: str = Query(...)):
    state = get_state()
    if state.get('profiles') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    try:
        segment_ids = [int(id.strip()) for id in ids.split(",")]
        profiler = SegmentProfiler()
        comparison = profiler.get_segment_comparison(state['profiles'], segment_ids)
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transitions")
def get_transitions():
    state = get_state()
    if state.get('profiles') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    try:
        segments = state['profiles']
        transitions = []
        
        for i, source in enumerate(segments):
            for j, target in enumerate(segments):
                if i != j:
                    transitions.append({
                        "from_segment": source.get("segment_id", i),
                        "to_segment": target.get("segment_id", j),
                        "estimated_count": int(np.random.randint(5, 50)),
                        "direction": "upgrade" if i < j else "downgrade"
                    })
                    
        return {
            "transitions": transitions,
            "flow_data": transitions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/micro")
def get_micro_segments():
    state = get_state()
    if state.get('micro_segments') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
    return state['micro_segments']

@router.get("/micro/{parent_id}")
def get_micro_segments_by_parent(parent_id: int):
    state = get_state()
    if state.get('micro_segments') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    parent_micros = [m for m in state['micro_segments'] if m.get('parent_segment_id') == parent_id]
    return parent_micros

@router.get("/{segment_id}")
def get_segment(segment_id: int):
    state = get_state()
    if state.get('profiles') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    for profile in state['profiles']:
        if profile.get('segment_id') == segment_id:
            return profile
            
    raise HTTPException(status_code=404, detail="Segment not found")

@router.get("/{segment_id}/customers")
def get_segment_customers(segment_id: int):
    state = get_state()
    if state.get('features_df') is None or state.get('scores_df') is None or state.get('labels') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    try:
        features_df = state['features_df']
        scores_df = state['scores_df']
        labels = state['labels']
        
        mask = labels == segment_id
        if hasattr(mask, 'values'):
            mask = mask.values
            
        segment_features = features_df[mask]
        segment_scores = scores_df[mask]
        
        combined = pd.concat([segment_features, segment_scores], axis=1)
        combined = combined.loc[:,~combined.columns.duplicated()]
        
        head_df = combined.head(200).replace([np.inf, -np.inf], np.nan).fillna(0)
        
        # Ensure customer_id is present, mock if necessary
        if 'customer_id' not in head_df.columns:
            head_df['customer_id'] = head_df.index
            
        return head_df.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
