import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Clean NaN/null values from response data
api.interceptors.response.use((response) => {
  if (response.data) {
    response.data = JSON.parse(
      JSON.stringify(response.data, (_, value) =>
        value === null || value === undefined || (typeof value === 'number' && isNaN(value)) ? 0 : value
      )
    );
  }
  return response;
});

// ─── Data Endpoints ──────────────────────────────────────────────────
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/data/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const generateSyntheticData = async () => {
  const { data } = await api.post('/data/generate-synthetic');
  return data;
};

export const getDataQuality = async () => {
  const { data } = await api.get('/data/quality');
  return data;
};

export const getDataPreview = async () => {
  const { data } = await api.get('/data/preview');
  return data;
};

export const getColumns = async () => {
  const { data } = await api.get('/data/columns');
  return data;
};

// ─── Analysis Endpoints ──────────────────────────────────────────────
export const runAnalysis = async () => {
  const { data } = await api.post('/analysis/run');
  return data;
};

export const getAnalysisStatus = async () => {
  const { data } = await api.get('/analysis/status');
  return data;
};

export const getFeatureStore = async () => {
  const { data } = await api.get('/analysis/features');
  return data;
};

export const getScores = async () => {
  const { data } = await api.get('/analysis/scores');
  return data;
};

export const getScoresSummary = async () => {
  const { data } = await api.get('/analysis/scores/summary');
  return data;
};

// ─── Segment Endpoints ──────────────────────────────────────────────
export const getSegments = async () => {
  const { data } = await api.get('/segments');
  return data;
};

export const getSegmentDetail = async (segmentId: number) => {
  const { data } = await api.get(`/segments/${segmentId}`);
  return data;
};

export const getSegmentCustomers = async (segmentId: number) => {
  const { data } = await api.get(`/segments/${segmentId}/customers`);
  return data;
};

export const compareSegments = async (ids: number[]) => {
  const { data } = await api.get('/segments/compare', { params: { ids: ids.join(',') } });
  return data;
};

export const getTransitions = async () => {
  const { data } = await api.get('/segments/transitions');
  return data;
};

export const getMicroSegments = async () => {
  const { data } = await api.get('/segments/micro');
  return data;
};

// ─── Customer Endpoints ──────────────────────────────────────────────
export const getCustomers = async (params?: Record<string, any>) => {
  const { data } = await api.get('/customers', { params });
  return data;
};

export const getCustomer360 = async (customerId: string) => {
  const { data } = await api.get(`/customers/${customerId}`);
  return data;
};

export const searchCustomers = async (query: string) => {
  const { data } = await api.get('/customers/search', { params: { q: query } });
  return data;
};

// ─── Marketing Endpoints ──────────────────────────────────────────────
export const getMarketingActions = async () => {
  const { data } = await api.get('/marketing/actions');
  return data;
};

export const getSegmentAction = async (segmentId: number) => {
  const { data } = await api.get(`/marketing/actions/${segmentId}`);
  return data;
};

export const generateCampaign = async (segmentId: number, instructions?: string) => {
  const { data } = await api.post('/marketing/campaign', {
    segment_id: segmentId,
    custom_instructions: instructions || '',
  });
  return data;
};

export const runSimulation = async (segmentId: number, action: string, intensity: number) => {
  const { data } = await api.post('/marketing/simulate', {
    segment_id: segmentId,
    action,
    intensity,
  });
  return data;
};

export const getMarketingFatigue = async () => {
  const { data } = await api.get('/marketing/fatigue');
  return data;
};

// ─── AI Endpoints ──────────────────────────────────────────────────
export const askCopilot = async (question: string) => {
  const { data } = await api.post('/ai/copilot', { question });
  return data;
};

export const generateAICampaign = async (segmentId: number, instructions: string) => {
  const { data } = await api.post('/ai/campaign', {
    segment_id: segmentId,
    instructions,
  });
  return data;
};

// ─── Export Endpoints ──────────────────────────────────────────────────
export const exportSegmentsCSV = () => `${API_BASE}/export/segments/csv`;
export const exportCustomersCSV = () => `${API_BASE}/export/customers/csv`;
export const exportReportPDF = () => `${API_BASE}/export/report/pdf`;

// ─── Model Endpoints ──────────────────────────────────────────────────
export const getModelEvaluation = async () => {
  const { data } = await api.get('/model/evaluation');
  return data;
};

export const getModelComparison = async () => {
  const { data } = await api.get('/model/comparison');
  return data;
};

// ─── Intelligence Endpoints ──────────────────────────────────────────────
export const getRevenueAutopsy = async () => {
  const { data } = await api.get('/intelligence/revenue-autopsy');
  return data;
};

export const getRevenueForecast = async (horizonDays: number = 90) => {
  const { data } = await api.get('/intelligence/forecast', { params: { horizon_days: horizonDays } });
  return data;
};

export const getCohorts = async () => {
  const { data } = await api.get('/intelligence/cohorts');
  return data;
};

export const getAnomalies = async () => {
  const { data } = await api.get('/intelligence/anomalies');
  return data;
};

export const getAlerts = async () => {
  const { data } = await api.get('/intelligence/alerts');
  return data;
};

export const getRescueQueue = async () => {
  const { data } = await api.get('/intelligence/rescue-queue');
  return data;
};

export const getTribes = async () => {
  const { data } = await api.get('/intelligence/tribes');
  return data;
};

export const getGoldenHours = async () => {
  const { data } = await api.get('/intelligence/golden-hours');
  return data;
};

// ─── Status ──────────────────────────────────────────────────
export const getAppStatus = async () => {
  const { data } = await api.get('/status');
  return data;
};

export default api;
