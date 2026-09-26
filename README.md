# BehaviorIQ — Behavioral Customer Segmentation & Personalized Marketing Intelligence Platform

> **OBSERVE → UNDERSTAND → PREDICT → ACT → MEASURE**

A production-quality full-stack AI platform that analyzes real customer behavior across purchase history, engagement patterns, and product usage to automatically discover meaningful customer segments, generate behavioral scores, and produce specific marketing actions for every segment.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### 1. Install Backend Dependencies
```bash
cd behavioriq
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Set Up Environment (Optional)
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY for AI features
# The app works without it — AI features will use rule-based fallback
```

### 4. Start Backend
```bash
# From the behavioriq root directory
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Start Frontend
```bash
cd frontend
npm run dev
```

### 6. Open the App
Visit **http://localhost:5173** → Click "Try Demo Data" on the landing page → The system generates 10,000 synthetic customers and runs the full ML pipeline automatically.

---

## 📊 What This Platform Does

1. **Data Ingestion**: Upload CSV/Excel or generate 10K realistic synthetic customers
2. **Feature Engineering**: 30+ behavioral features auto-generated (RFM, engagement, purchase, loyalty, churn signals)
3. **Behavior Scoring**: 7 individual scores + PCA-weighted composite per customer
4. **Multi-Model Segmentation**: K-Means, Hierarchical, DBSCAN, GMM — all compared
5. **Intelligent Naming**: Segments named from behavior (e.g., "High-Value Loyalists" not "Cluster 0")
6. **Explainability**: Feature importance, radar charts, heatmaps, natural-language explanations
7. **Marketing Actions**: Per-segment strategy, channel, offer, frequency, objective
8. **AI Copilot**: Ask marketing questions grounded in actual data
9. **Campaign Generator**: Full campaign copy (email, SMS, push) per segment
10. **What-If Simulator**: Estimate impact of marketing actions
11. **Revenue Intelligence**: Autopsy + forecasting per segment
12. **Customer Rescue Queue**: Priority-ranked at-risk customers

## 🧬 Unique Features

- **Customer DNA Fingerprint**: Visual barcode of behavioral profile
- **Behavioral Anomaly Radar**: Catches behavioral shifts before churn
- **Marketing Fatigue Index**: Prevents over-contacting
- **Micro-Segment Discovery**: Niche sub-segments within primary segments
- **Golden Hour Detection**: Best time/day to contact each segment
- **Segment Gravity Map**: How segments naturally attract customers
- **Cohort Comparison**: Compare customer cohorts by signup period
- **Smart Alert System**: Proactive alerts for behavioral shifts

## 🏗 Architecture

```
behavioriq/
├── backend/              # Python FastAPI
│   ├── main.py           # App entry point
│   ├── ml/               # ML pipeline (12 modules)
│   ├── ai/               # LLM integration
│   ├── services/         # Business logic (8 services)
│   ├── routers/          # API endpoints (9 routers)
│   └── utils/            # Helpers & exporters
├── frontend/             # React + TypeScript + Tailwind
│   └── src/
│       ├── pages/        # 18 pages
│       ├── components/   # Reusable UI components
│       ├── services/     # API client
│       └── stores/       # Zustand state
└── data/                 # Datasets & exports
```

## 📄 Dataset Format

The system accepts CSV/Excel with customer behavioral data. Minimum required columns:
- `customer_id`, `total_spending`, `order_count`, `last_purchase_date`

See the full dataset specification in the implementation plan for all supported columns.

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Recharts, Framer Motion |
| Backend | Python, FastAPI, Pydantic |
| ML | scikit-learn, pandas, numpy, scipy |
| AI | Google Gemini API (optional, has rule-based fallback) |
| Database | In-memory (SQLite-ready) |

## 📝 License

MIT
