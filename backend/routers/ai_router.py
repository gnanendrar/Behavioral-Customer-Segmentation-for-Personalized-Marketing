from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.main import get_state
from backend.ai.copilot import MarketingCopilot
from backend.config import settings
from backend.ai.campaign_gen import CampaignGenerator

router = APIRouter()

class CopilotRequest(BaseModel):
    question: str

class CampaignGenRequest(BaseModel):
    segment_id: int
    instructions: str

@router.post("/copilot")
def ask_copilot(req: CopilotRequest):
    state = get_state()
    if state.get('profiles') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    try:
        context = {
            "segments": state.get('profiles'),
            "alerts": state.get('alerts'),
            "marketing_actions": state.get('marketing_actions'),
            "pipeline_status": state.get('pipeline_status')
        }
        
        copilot = MarketingCopilot()
        response = copilot.answer(req.question, context)
        
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/campaign")
def generate_ai_campaign(req: CampaignGenRequest):
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
        campaign = generator.generate_campaign(segment_profile, req.instructions)
        return campaign
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
