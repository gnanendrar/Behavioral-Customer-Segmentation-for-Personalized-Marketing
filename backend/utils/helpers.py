import numpy as np
import uuid
import re
from typing import List, Union

def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    try:
        if denominator == 0:
            return default
        return float(numerator) / float(denominator)
    except (TypeError, ValueError):
        return default

def percentile_rank(values: np.ndarray, value: float) -> float:
    if len(values) == 0:
        return 0.0
    return float((values < value).mean() * 100)

def clip_score(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    if value < min_val:
        return float(min_val)
    if value > max_val:
        return float(max_val)
    return float(value)

def format_currency(value: float) -> str:
    return f"${value:,.2f}"

def format_percentage(value: float) -> str:
    return f"{value:.1f}%"

def format_number(value: float) -> str:
    return f"{value:,.0f}"

def clean_column_name(name: str) -> str:
    name = str(name).lower()
    name = re.sub(r'[^a-z0-9\s_]', '', name)
    name = re.sub(r'\s+', '_', name)
    return name

def generate_id() -> str:
    return str(uuid.uuid4())[:8]

def calculate_gini_coefficient(values: np.ndarray) -> float:
    values = np.asarray(values, dtype=float)
    if len(values) == 0:
        return 0.0
    values = np.sort(values)
    if values.min() < 0:
        values -= values.min()
    values += 1e-8 # avoid division by zero
    n = len(values)
    index = np.arange(1, n + 1)
    return float((np.sum((2 * index - n  - 1) * values)) / (n * np.sum(values)))

def detect_trend(values: List[float]) -> str:
    if len(values) < 2:
        return 'stable'
    
    # Simple linear regression slope
    x = np.arange(len(values))
    y = np.array(values)
    slope, _ = np.polyfit(x, y, 1)
    
    if slope > 0.01:
        return 'increasing'
    elif slope < -0.01:
        return 'decreasing'
    return 'stable'

def get_quartile_label(value: float, values: np.ndarray) -> str:
    if len(values) == 0:
        return 'Q1'
    q1, q2, q3 = np.percentile(values, [25, 50, 75])
    if value <= q1:
        return 'Q1'
    elif value <= q2:
        return 'Q2'
    elif value <= q3:
        return 'Q3'
    else:
        return 'Q4'
