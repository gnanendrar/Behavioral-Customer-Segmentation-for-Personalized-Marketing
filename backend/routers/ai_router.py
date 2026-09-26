from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.main import get_state
from backend.ai.copilot import MarketingCopilot
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
        profiles = state.get('profiles', [])
        features_df = state.get('features_df')
        
        total_customers = len(features_df) if features_df is not None else sum(p.get('customer_count', 0) for p in profiles)
        total_revenue = sum(float(p.get('avg_order_value', 50.0)) * int(p.get('customer_count', 1)) for p in profiles)
        
        normalized_segments = []
        for p in profiles:
            normalized_segments.append({
                "segment_id": p.get("segment_id", 0),
                "name": p.get("segment_name", f"Segment {p.get('segment_id', 0)}"),
                "segment_name": p.get("segment_name", f"Segment {p.get('segment_id', 0)}"),
                "customer_count": p.get("customer_count", 0),
                "revenue": float(p.get("avg_order_value", 50) * p.get("customer_count", 1)),
                "avg_value": float(p.get("avg_value_score", p.get("avg_order_value", 0))),
                "churn_risk": f"{p.get('avg_churn_risk', 0):.1f}%",
                "key_characteristics": p.get("key_characteristics", [])
            })
            
        stats = {
            "total_customers": total_customers,
            "total_revenue": total_revenue,
            "n_segments": len(profiles)
        }
        
        context = {
            "segments": normalized_segments,
            "overall_stats": stats,
            "alerts": state.get('alerts', []),
            "marketing_actions": state.get('marketing_actions', []),
            "pipeline_status": state.get('pipeline_status')
        }
        
        copilot = MarketingCopilot()
        response = copilot.answer(req.question, context)
        
        if isinstance(response, dict):
            out = dict(response)
            out["response"] = response
            return out
        return {"response": response, "answer": str(response)}
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
