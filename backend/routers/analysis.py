from fastapi import APIRouter, HTTPException
import numpy as np
from backend.main import get_state
from backend.ml.data_processor import DataProcessor
from backend.ml.feature_engine import FeatureEngine
from backend.ml.scoring import ScoringEngine
from backend.ml.clustering import ClusteringEngine
from backend.ml.segment_profiler import SegmentProfiler
from backend.ml.explainability import ExplainabilityEngine
from backend.ml.micro_segments import MicroSegmentEngine
from backend.services.marketing_engine import MarketingEngine
from backend.services.alert_system import AlertSystem

router = APIRouter()

@router.post("/run")
def run_pipeline():
    state = get_state()
    if state.get('raw_data') is None:
        raise HTTPException(status_code=404, detail="No data available. Upload data first.")
        
    state['pipeline_status'] = 'running'
    state['pipeline_error'] = None
    
    try:
        raw_data = state['raw_data']
        column_mapping = state.get('column_mapping', DataProcessor().detect_columns(raw_data))
        
        # 3. Clean data
        cleaned_df = DataProcessor().clean_data(raw_data, column_mapping)
        state['cleaned_data'] = cleaned_df
        
        # 4. Engineer features
        feature_engine = FeatureEngine()
        features_df, feature_metadata = feature_engine.engineer_features(cleaned_df)
        state['features_df'] = features_df
        state['feature_metadata'] = feature_metadata
        
        print(f"DEBUG: features_df columns = {features_df.columns.tolist()}")
        # 5. Calculate scores
        scoring_engine = ScoringEngine()
        scores_df = scoring_engine.calculate_scores(features_df)
        state['scores_df'] = scores_df
        print(f"DEBUG: scores_df columns = {scores_df.columns.tolist()}")
        
        # 6. Run clustering
        clustering_engine = ClusteringEngine()
        clustering_results = clustering_engine.fit(features_df)
        labels = clustering_engine.labels
        state['labels'] = labels
        state['evaluation_results'] = clustering_results
        
        # 8. Profile segments
        segment_profiler = SegmentProfiler()
        profiles = segment_profiler.profile_segments(features_df, scores_df, labels)
        state['profiles'] = profiles
        
        # 9. Generate marketing actions
        marketing_engine = MarketingEngine()
        marketing_actions = marketing_engine.generate_actions(profiles)
        state['marketing_actions'] = marketing_actions
        
        # 10. Run explainability
        explainability_engine = ExplainabilityEngine()
        # compute_feature_importance might modify state or just return data
        explainability_results = explainability_engine.compute_feature_importance(features_df, labels)
        
        # 11. Generate alerts
        alert_system = AlertSystem()
        alerts = alert_system.generate_alerts(features_df, scores_df, profiles, labels)
        state['alerts'] = alerts
        
        # 12. Discover micro-segments
        micro_segment_engine = MicroSegmentEngine()
        micro_segments = micro_segment_engine.discover(features_df, scores_df, labels, profiles)
        state['micro_segments'] = micro_segments
        
        state['pipeline_status'] = 'completed'
        
        segment_names = {p['segment_id']: p.get('segment_name', f"Segment {p['segment_id']}") for p in profiles} if profiles else {}
        
        return {
            "status": "completed",
            "total_customers": len(features_df),
            "total_segments": len(profiles) if profiles else 0,
            "segment_names": segment_names
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        state['pipeline_status'] = 'error'
        state['pipeline_error'] = str(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
def get_status():
    state = get_state()
    return {
        "pipeline_status": state.get('pipeline_status'),
        "pipeline_error": state.get('pipeline_error')
    }

@router.get("/features")
def get_features():
    state = get_state()
    return state.get('feature_metadata', {})

@router.get("/scores")
def get_scores():
    state = get_state()
    if state.get('scores_df') is None:
        raise HTTPException(status_code=404, detail="No scores available. Run pipeline first.")
        
    try:
        df = state['scores_df'].head(100)
        df_safe = df.replace([np.inf, -np.inf], np.nan).fillna(0)
        return df_safe.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scores/summary")
def get_scores_summary():
    state = get_state()
    if state.get('scores_df') is None:
        raise HTTPException(status_code=404, detail="No scores available. Run pipeline first.")
        
    try:
        scoring_engine = ScoringEngine()
        return scoring_engine.get_score_summary(state['scores_df'])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
