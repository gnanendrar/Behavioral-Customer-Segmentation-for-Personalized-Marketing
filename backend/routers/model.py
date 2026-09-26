from fastapi import APIRouter, HTTPException
from backend.main import get_state
from backend.ml.clustering import ClusteringEngine

router = APIRouter()

@router.get("/evaluation")
def get_evaluation():
    state = get_state()
    if state.get('evaluation_results') is None:
        raise HTTPException(status_code=404, detail="No evaluation results available. Run the pipeline first.")
    
    return state['evaluation_results']

@router.get("/comparison")
def get_comparison():
    state = get_state()
    if state.get('features_df') is None:
        raise HTTPException(status_code=404, detail="No data available. Run the pipeline first.")
        
    try:
        engine = ClusteringEngine()
        comparison = engine.get_algorithm_comparison(state['features_df']) if hasattr(engine, 'get_algorithm_comparison') else {}
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
