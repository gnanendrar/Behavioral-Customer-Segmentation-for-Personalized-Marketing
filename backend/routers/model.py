from fastapi import APIRouter, HTTPException
import math
import numpy as np
from backend.main import get_state


def _json_safe(obj):
    """Replace NaN/inf (e.g. a DBSCAN eps column absent for other algorithms) with None."""
    if isinstance(obj, dict):
        return {k: _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    if isinstance(obj, (np.floating, float)):
        f = float(obj)
        return None if math.isnan(f) or math.isinf(f) else f
    if isinstance(obj, np.integer):
        return int(obj)
    return obj

router = APIRouter()


def _ui_row(cfg: dict, is_best: bool) -> dict:
    """Shape one scored configuration the way the frontend tables and charts read it."""
    return {
        'algorithm': cfg.get('algorithm'),
        'k': cfg.get('k'),
        'n_clusters': cfg.get('k'),
        'silhouette_score': cfg.get('silhouette'),
        'davies_bouldin_score': cfg.get('davies_bouldin'),
        'calinski_harabasz_score': cfg.get('calinski_harabasz'),
        'stability': cfg.get('stability'),
        'composite_score': cfg.get('composite_score'),
        'rank': cfg.get('rank'),
        'is_best': is_best,
    }


@router.get("/evaluation")
def get_evaluation():
    state = get_state()
    if state.get('evaluation_results') is None:
        raise HTTPException(status_code=404, detail="No evaluation results available. Run the pipeline first.")

    return _json_safe(state['evaluation_results'])


@router.get("/comparison")
def get_comparison():
    """Best configuration of each algorithm, from the scores computed during the pipeline run."""
    state = get_state()
    results = state.get('evaluation_results')
    if results is None:
        raise HTTPException(status_code=404, detail="No data available. Run the pipeline first.")

    configs = results.get('ranked_configurations', [])  # sorted best-first
    seen = set()
    rows = []
    for i, cfg in enumerate(configs):
        algo = cfg.get('algorithm')
        if algo in seen:
            continue
        seen.add(algo)
        rows.append(_ui_row(cfg, is_best=(i == 0)))
    return _json_safe(rows)
