from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.main import get_state
from backend.utils.exporters import DataExporter
import os

router = APIRouter()

@router.get("/segments/csv")
def export_segments_csv():
    state = get_state()
    if state.get('profiles') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    try:
        exporter = DataExporter()
        filepath = exporter.export_segments_csv(state['profiles'])
        
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found after generation")
            
        return FileResponse(
            path=filepath, 
            filename="segments_export.csv", 
            media_type="text/csv"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/customers/csv")
def export_customers_csv():
    state = get_state()
    if state.get('features_df') is None or state.get('labels') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    try:
        exporter = DataExporter()
        filepath = exporter.export_customers_csv(state['features_df'], state['labels'], state.get('scores_df'))
        
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found after generation")
            
        return FileResponse(
            path=filepath, 
            filename="customers_export.csv", 
            media_type="text/csv"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report/pdf")
def export_report_pdf():
    state = get_state()
    if state.get('profiles') is None:
        raise HTTPException(status_code=404, detail="No analysis available. Run the pipeline first.")
        
    try:
        exporter = DataExporter()
        filepath = exporter.export_report_pdf(state)
        
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found after generation")
            
        return FileResponse(
            path=filepath, 
            filename="behavioriq_report.pdf", 
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
