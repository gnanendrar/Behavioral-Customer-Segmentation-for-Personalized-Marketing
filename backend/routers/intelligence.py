from fastapi import APIRouter, HTTPException, Query
from backend.main import get_state
from backend.services.revenue_autopsy import RevenueAutopsy
from backend.ml.forecaster import RevenueForecaster
from backend.services.cohort_engine import CohortEngine
from backend.services.anomaly_radar import AnomalyRadar
from backend.services.rescue_queue import RescueQueue
from backend.services.tribe_mapper import TribeMapper
from backend.services.golden_hour import GoldenHourAnalyzer

router = APIRouter()

@router.get("/revenue-autopsy")
def get_revenue_autopsy():
    state = get_state()
    if state.get('features_df') is None or state.get('profiles') is None or state.get('labels') is None:
        raise HTTPException(status_code=404, detail="No data available. Run the pipeline first.")
        
    try:
        autopsy = RevenueAutopsy()
        results = autopsy.analyze(
            features_df=state['features_df'],
            profiles=state.get('profiles', []),
            labels=state['labels']
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast")
def get_forecast(horizon_days: int = Query(90)):
    state = get_state()
    if state.get('features_df') is None or state.get('profiles') is None or state.get('labels') is None:
        raise HTTPException(status_code=404, detail="No data available. Run the pipeline first.")
        
    try:
        forecaster = RevenueForecaster()
        results = forecaster.forecast(
            features_df=state['features_df'],
            scores_df=state.get('scores_df'),
            profiles=state.get('profiles', []),
            labels=state['labels'],
            horizon_days=horizon_days
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cohorts")
def get_cohorts():
    state = get_state()
    if state.get('features_df') is None or state.get('scores_df') is None or state.get('labels') is None:
        raise HTTPException(status_code=404, detail="No data available. Run the pipeline first.")
        
    try:
        cohort_engine = CohortEngine()
        results = cohort_engine.analyze_cohorts(
            features_df=state['features_df'],
            scores_df=state['scores_df'],
            labels=state['labels']
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/anomalies")
def get_anomalies():
    state = get_state()
    if state.get('features_df') is None or state.get('scores_df') is None or state.get('labels') is None:
        raise HTTPException(status_code=404, detail="No data available. Run the pipeline first.")
        
    try:
        radar = AnomalyRadar()
        results = radar.detect_anomalies(
            features_df=state['features_df'],
            scores_df=state['scores_df'],
            labels=state['labels']
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
def get_alerts():
    state = get_state()
    if state.get('alerts') is None:
        raise HTTPException(status_code=404, detail="No alerts available. Run the pipeline first.")
    return state['alerts']

@router.get("/rescue-queue")
def get_rescue_queue():
    state = get_state()
    if state.get('features_df') is None or state.get('scores_df') is None or state.get('labels') is None:
        raise HTTPException(status_code=404, detail="No data available. Run the pipeline first.")
        
    try:
        rescue = RescueQueue()
        results = rescue.build_queue(
            features_df=state['features_df'],
            scores_df=state['scores_df'],
            profiles=state.get('profiles', []),
            labels=state['labels']
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tribes")
def get_tribes():
    state = get_state()
    if state.get('features_df') is None or state.get('scores_df') is None or state.get('labels') is None:
        raise HTTPException(status_code=404, detail="No data available. Run the pipeline first.")
        
    try:
        mapper = TribeMapper()
        results = mapper.build_network(
            features_df=state['features_df'],
            scores_df=state['scores_df'],
            labels=state['labels']
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/golden-hours")
def get_golden_hours():
    state = get_state()
    if state.get('features_df') is None or state.get('profiles') is None or state.get('labels') is None:
        raise HTTPException(status_code=404, detail="No data available. Run the pipeline first.")
        
    try:
        analyzer = GoldenHourAnalyzer()
        results = analyzer.analyze(
            features_df=state['features_df'],
            profiles=state.get('profiles', []),
            labels=state['labels']
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
