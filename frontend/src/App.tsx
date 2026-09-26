import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DataUpload = lazy(() => import('./pages/DataUpload'));
const DataQuality = lazy(() => import('./pages/DataQuality'));
const FeatureStore = lazy(() => import('./pages/FeatureStore'));
const Segmentation = lazy(() => import('./pages/Segmentation'));
const SegmentExplorer = lazy(() => import('./pages/SegmentExplorer'));
const Customer360 = lazy(() => import('./pages/Customer360'));
const RescueQueue = lazy(() => import('./pages/RescueQueue'));
const MarketingActions = lazy(() => import('./pages/MarketingActions'));
const AICopilot = lazy(() => import('./pages/AICopilot'));
const CampaignGenerator = lazy(() => import('./pages/CampaignGenerator'));
const BehaviorJourney = lazy(() => import('./pages/BehaviorJourney'));
const WhatIfSimulator = lazy(() => import('./pages/WhatIfSimulator'));
const CohortAnalysis = lazy(() => import('./pages/CohortAnalysis'));
const RevenueIntelligence = lazy(() => import('./pages/RevenueIntelligence'));
const ModelEvaluation = lazy(() => import('./pages/ModelEvaluation'));
const Reports = lazy(() => import('./pages/Reports'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<DataUpload />} />
            <Route path="/quality" element={<DataQuality />} />
            <Route path="/features" element={<FeatureStore />} />
            <Route path="/segmentation" element={<Segmentation />} />
            <Route path="/segments" element={<SegmentExplorer />} />
            <Route path="/customer/:id" element={<Customer360 />} />
            <Route path="/rescue" element={<RescueQueue />} />
            <Route path="/marketing" element={<MarketingActions />} />
            <Route path="/copilot" element={<AICopilot />} />
            <Route path="/campaign" element={<CampaignGenerator />} />
            <Route path="/journey" element={<BehaviorJourney />} />
            <Route path="/simulator" element={<WhatIfSimulator />} />
            <Route path="/cohorts" element={<CohortAnalysis />} />
            <Route path="/revenue" element={<RevenueIntelligence />} />
            <Route path="/model" element={<ModelEvaluation />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
