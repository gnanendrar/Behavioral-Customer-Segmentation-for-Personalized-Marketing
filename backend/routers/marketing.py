from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.main import get_state
from backend.ai.campaign_gen import CampaignGenerator
from backend.ml.simulator import MarketingSimulator
from backend.services.marketing_engine import MarketingEngine

router = APIRouter()

class CampaignRequest(BaseModel):
    segment_id: int
    custom_instructions: Optional[str] = None

class SimulateRequest(BaseModel):
    segment_id: int
    action: str
    intensity: float

@router.get("/actions")
def get_marketing_actions():
    state = get_state()
    if state.get('marketing_actions') is None:
        raise HTTPException(status_code=404, detail="No marketing actions available. Run the pipeline first.")
    return state['marketing_actions']

@router.get("/actions/{segment_id}")
def get_marketing_action_for_segment(segment_id: int):
    state = get_state()
    if state.get('marketing_actions') is None:
        raise HTTPException(status_code=404, detail="No marketing actions available. Run the pipeline first.")
        
    actions = state['marketing_actions']
    if isinstance(actions, dict) and str(segment_id) in actions:
        return actions[str(segment_id)]
    elif isinstance(actions, list):
        for action in actions:
            if action.get('segment_id') == segment_id:
                return action
                
    raise HTTPException(status_code=404, detail=f"No action found for segment {segment_id}")

@router.post("/campaign")
def generate_campaign(req: CampaignRequest):
    state = get_state()
    if state.get('profiles') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    segment_profile = None
    for profile in state['profiles']:
        if profile.get('segment_id') == req.segment_id:
            segment_profile = profile
            break
            
    if not segment_profile:
        raise HTTPException(status_code=404, detail=f"Segment {req.segment_id} not found")
        
    try:
        generator = CampaignGenerator()
        campaign = generator.generate_campaign(segment_profile, req.custom_instructions)
        return campaign
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/simulate")
def simulate_marketing(req: SimulateRequest):
    state = get_state()
    if state.get('profiles') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    try:
        simulator = MarketingSimulator()
        results = simulator.simulate(req.segment_id, req.action, req.intensity, state)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fatigue")
def get_marketing_fatigue():
    state = get_state()
    if state.get('features_df') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    try:
        engine = MarketingEngine()
        fatigue = engine.calculate_fatigue_index(state.get('features_df'), state.get('labels')) if hasattr(engine, 'calculate_fatigue_index') else {}
        return fatigue
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
