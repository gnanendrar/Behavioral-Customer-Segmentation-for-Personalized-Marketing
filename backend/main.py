"""
BehaviorIQ — Main FastAPI Application
"""
import os
import sys
import json
import traceback
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    # Ensure data directories exist
    os.makedirs("data/uploads", exist_ok=True)
    os.makedirs("data/exports", exist_ok=True)
    os.makedirs("data", exist_ok=True)
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    yield
    print(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Behavioral Customer Segmentation & Personalized Marketing Intelligence Platform",
    lifespan=lifespan,
)

# CORS - allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-Memory Analysis State ──────────────────────────────────────────
# This acts as our "database" for the current analysis session
analysis_state = {
    "raw_data": None,           # pd.DataFrame
    "cleaned_data": None,       # pd.DataFrame
    "features_df": None,        # pd.DataFrame with engineered features
    "scores_df": None,          # pd.DataFrame with behavioral scores
    "labels": None,             # np.ndarray of cluster labels
    "profiles": None,           # list[dict] segment profiles
    "micro_segments": None,     # list[dict] micro segments
    "marketing_actions": None,  # list[dict]
    "alerts": None,             # list[dict]
    "feature_metadata": None,   # list[dict]
    "evaluation_results": None, # dict
    "column_mapping": None,     # dict
    "data_quality": None,       # dict
    "pipeline_status": "idle",  # idle | running | completed | error
    "pipeline_error": None,     # str
    "uploaded_filename": None,  # str
}

def get_state():
    """Get the global analysis state."""
    return analysis_state


# ─── Import and Register Routers ──────────────────────────────────────
from backend.routers import data, analysis, segments, customers, marketing, ai_router, export, model, intelligence

app.include_router(data.router, prefix="/api/data", tags=["Data"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(segments.router, prefix="/api/segments", tags=["Segments"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(marketing.router, prefix="/api/marketing", tags=["Marketing"])
app.include_router(ai_router.router, prefix="/api/ai", tags=["AI"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])
app.include_router(model.router, prefix="/api/model", tags=["Model"])
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["Intelligence"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/api/status")
async def get_pipeline_status():
    """Get current pipeline status."""
    state = get_state()
    has_data = state["raw_data"] is not None
    has_analysis = state["profiles"] is not None

    return {
        "pipeline_status": state["pipeline_status"],
        "has_data": has_data,
        "has_analysis": has_analysis,
        "uploaded_filename": state["uploaded_filename"],
        "total_customers": len(state["raw_data"]) if has_data else 0,
        "total_segments": len(state["profiles"]) if has_analysis else 0,
        "error": state["pipeline_error"],
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
