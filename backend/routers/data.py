from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import os
import numpy as np
from backend.main import get_state
from backend.ml.data_processor import DataProcessor
from backend.ml.synthetic_data import generate_synthetic_dataset

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    state = get_state()
    
    upload_dir = os.path.join("data", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
            
        state['raw_data'] = df
        state['uploaded_filename'] = file.filename
        
        processor = DataProcessor()
        column_mapping = processor.detect_columns(df)
        state['column_mapping'] = column_mapping
        
        preview_df = df.head(10).replace([np.inf, -np.inf], np.nan).fillna(0)
        
        return {
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "column_mapping": column_mapping,
            "preview": preview_df.to_dict(orient='records')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quality")
def get_quality():
    state = get_state()
    if state.get('raw_data') is None:
        raise HTTPException(status_code=404, detail="No data available. Upload data first.")
        
    try:
        processor = DataProcessor()
        quality_report = processor.get_data_quality_report(state['raw_data'])
        return quality_report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview")
def get_preview():
    state = get_state()
    if state.get('raw_data') is None:
        raise HTTPException(status_code=404, detail="No data available. Upload data first.")
        
    try:
        df = state['raw_data'].head(50)
        df_safe = df.replace([np.inf, -np.inf], np.nan).fillna(0)
        
        columns = [{"name": col, "type": str(dtype)} for col, dtype in df.dtypes.items()]
        
        return {
            "columns": columns,
            "data": df_safe.to_dict(orient='records')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-synthetic")
def generate_synthetic():
    state = get_state()
    
    try:
        df = generate_synthetic_dataset()
        state['raw_data'] = df
        state['uploaded_filename'] = "synthetic_customers.csv"
        
        save_dir = os.path.join("data")
        os.makedirs(save_dir, exist_ok=True)
        file_path = os.path.join(save_dir, "synthetic_customers.csv")
        df.to_csv(file_path, index=False)
        
        processor = DataProcessor()
        column_mapping = processor.detect_columns(df)
        state['column_mapping'] = column_mapping
        
        return {
            "rows": len(df),
            "columns": len(df.columns),
            "message": "Synthetic data generated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/columns")
def get_columns():
    state = get_state()
    if state.get('raw_data') is None:
        raise HTTPException(status_code=404, detail="No data available. Upload data first.")
        
    try:
        processor = DataProcessor()
        stats = processor.get_column_statistics(state['raw_data'])
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
