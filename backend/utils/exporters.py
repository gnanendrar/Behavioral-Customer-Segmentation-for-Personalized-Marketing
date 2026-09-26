import os
import csv
import json
import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Optional

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
except ImportError:
    pass # Needs reportlab in environment

class DataExporter:
    """Export functionality."""
    
    def __init__(self, default_export_dir: str = './data/exports/'):
        self.default_export_dir = default_export_dir
        os.makedirs(self.default_export_dir, exist_ok=True)
        
    def _get_output_path(self, output_path: Optional[str], prefix: str, ext: str) -> str:
        if output_path is not None:
            return output_path
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{prefix}_{timestamp}.{ext}"
        return os.path.join(self.default_export_dir, filename)

    def export_segments_csv(self, profiles: List[Dict[str, Any]], output_path: Optional[str] = None) -> str:
        out_path = self._get_output_path(output_path, "segments", "csv")
        
        if not profiles:
            return out_path
            
        df = pd.json_normalize(profiles)
        df.to_csv(out_path, index=False)
        return out_path

    def export_customers_csv(self, features_df: pd.DataFrame, scores_df: pd.DataFrame, labels: np.ndarray, profiles: List[Dict[str, Any]], output_path: Optional[str] = None) -> str:
        out_path = self._get_output_path(output_path, "customers", "csv")
        
        df = features_df.copy()
        df['segment_id'] = labels
        
        # Add scores
        for col in scores_df.columns:
            df[col] = scores_df[col]
            
        # Map segment names
        segment_map = {p.get('segment_id', i): p.get('name', f"Segment {i}") for i, p in enumerate(profiles)}
        df['segment_name'] = df['segment_id'].map(segment_map)
        
        df.to_csv(out_path, index=False)
        return out_path

    def export_marketing_actions_csv(self, actions: List[Dict[str, Any]], output_path: Optional[str] = None) -> str:
        out_path = self._get_output_path(output_path, "marketing_actions", "csv")
        
        if not actions:
            return out_path
            
        df = pd.json_normalize(actions)
        df.to_csv(out_path, index=False)
        return out_path

    def export_report_pdf(self, profiles: List[Dict[str, Any]], actions: List[Dict[str, Any]], overall_stats: Dict[str, Any], output_path: Optional[str] = None) -> str:
        out_path = self._get_output_path(output_path, "report", "pdf")
        
        doc = SimpleDocTemplate(out_path, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        title_style = styles['Title']
        elements.append(Paragraph("BehaviorIQ Customer Segmentation Report", title_style))
        elements.append(Spacer(1, 12))
        
        # Executive Summary
        h2_style = styles['Heading2']
        elements.append(Paragraph("Executive Summary", h2_style))
        elements.append(Spacer(1, 6))
        
        normal_style = styles['Normal']
        summary_text = (
            f"Total Customers: {overall_stats.get('total_customers', 'N/A')}<br/>"
            f"Total Segments: {overall_stats.get('total_segments', 'N/A')}<br/>"
            f"Total Revenue: ${overall_stats.get('total_revenue', 0.0):,.2f}"
        )
        elements.append(Paragraph(summary_text, normal_style))
        elements.append(Spacer(1, 12))
        
        # Segment Overview Table
        elements.append(Paragraph("Segment Overview", h2_style))
        elements.append(Spacer(1, 6))
        
        table_data = [["Segment ID", "Name", "Size", "Avg Value"]]
        for p in profiles:
            table_data.append([
                str(p.get('segment_id', '')),
                str(p.get('name', '')),
                str(p.get('size', '')),
                f"${p.get('avg_value', 0.0):,.2f}"
            ])
            
        t = Table(table_data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.beige),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        elements.append(t)
        elements.append(Spacer(1, 12))
        
        # Marketing Recommendations Table
        elements.append(Paragraph("Marketing Recommendations", h2_style))
        elements.append(Spacer(1, 6))
        
        rec_data = [["Segment", "Action", "Expected Lift"]]
        for a in actions:
            rec_data.append([
                str(a.get('segment_name', '')),
                str(a.get('action', '')),
                str(a.get('expected_lift', ''))
            ])
            
        t2 = Table(rec_data)
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.lightgreen),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        elements.append(t2)
        elements.append(Spacer(1, 24))
        
        # Footer
        footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.gray)
        timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        elements.append(Paragraph(f"Generated by BehaviorIQ on {timestamp_str}", footer_style))
        
        doc.build(elements)
        return out_path
