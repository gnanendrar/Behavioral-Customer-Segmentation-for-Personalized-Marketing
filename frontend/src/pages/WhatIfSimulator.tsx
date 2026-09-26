import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Play, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { getSegments, runSimulation } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import { motion } from 'framer-motion';

const ACTIONS = [
  { id: 'discount', name: 'Apply Discount', unit: '%', min: 5, max: 50, default: 15 },
  { id: 'engagement_campaign', name: 'Engagement Campaign', unit: 'intensity (1-10)', min: 1, max: 10, default: 5 },
  { id: 'loyalty_program', name: 'Boost Loyalty Points', unit: 'multiplier', min: 1.5, max: 5, default: 2 },
  { id: 'premium_offer', name: 'Upsell Premium', unit: 'aggressiveness (1-10)', min: 1, max: 10, default: 5 },
  { id: 'price_increase', name: 'Price Increase', unit: '%', min: 1, max: 25, default: 5 },
];

export default function WhatIfSimulator() {
  const [segments, setSegments] = useState<any[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedActionId, setSelectedActionId] = useState<string>(ACTIONS[0].id);
  const [intensity, setIntensity] = useState<number>(ACTIONS[0].default);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const data = await getSegments();
        const segList = Array.isArray(data) ? data : (data?.segments || []);
        setSegments(segList);
        if (segList.length > 0) {
          setSelectedSegmentId(String(segList[0].segment_id ?? segList[0].id ?? ''));
        }
      } catch (err) {
        console.error("Failed to load segments", err);
      }
    };
    fetchSegments();
  }, []);

  const handleActionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const actionId = e.target.value;
    setSelectedActionId(actionId);
    const action = ACTIONS.find(a => a.id === actionId);
    if (action) setIntensity(action.default);
  };

  const handleSimulate = async () => {
    if (!selectedSegmentId) return;
    setLoading(true);
    try {
      const data = await runSimulation(Number(selectedSegmentId), selectedActionId, intensity);
      setResult(data);
    } catch (err) {
      console.error("Simulation failed", err);
      alert("Simulation failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const selectedActionDef = ACTIONS.find(a => a.id === selectedActionId);

  // Normalize results whether from mock or backend simulator
  const currentRev = result?.revenue?.current ?? result?.revenue_impact?.current_revenue ?? 0;
  const projectedRev = result?.revenue?.projected ?? result?.revenue_impact?.projected_revenue ?? 0;
  const revPctChange = result?.revenue?.pct_change ?? result?.revenue_impact?.revenue_change_pct ?? 0;
  const confidenceScore = result?.confidence_score ?? Math.round((result?.confidence ?? 0.8) * (result?.confidence <= 1 ? 100 : 1));

  let metricsList: Array<{ name: string; current: number; projected: number; pct_change: number }> = [];
  if (Array.isArray(result?.metrics)) {
    metricsList = result.metrics;
  } else if (result?.projected_changes && typeof result.projected_changes === 'object') {
    metricsList = Object.entries(result.projected_changes).map(([key, val]: [string, any]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      current: val.current ?? 0,
      projected: val.projected ?? 0,
      pct_change: val.change_pct ?? 0,
    }));
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader 
        title="What-If Simulator" 
        description="Simulate the impact of marketing actions on segments before executing them." 
      />

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Configure Scenario</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Segment</label>
            <select
              value={selectedSegmentId}
              onChange={(e) => setSelectedSegmentId(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm p-2.5 border bg-white focus:ring-indigo-500 focus:border-indigo-500"
            >
              {segments.map((s, i) => (
                <option key={i} value={s.segment_id ?? s.id}>{s.segment_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <select
              value={selectedActionId}
              onChange={handleActionChange}
              className="w-full border-gray-300 rounded-lg shadow-sm p-2.5 border bg-white focus:ring-indigo-500 focus:border-indigo-500"
            >
              {ACTIONS.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intensity ({intensity} {selectedActionDef?.unit})
            </label>
            <input
              type="range"
              min={selectedActionDef?.min}
              max={selectedActionDef?.max}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-3"
            />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSimulate}
            disabled={loading || !selectedSegmentId}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-6 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Play className="w-4 h-4 fill-current" />}
            Run Simulation
          </button>
        </div>
      </div>

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 font-medium">
                  DISCLAIMER: {result.disclaimer || 'These are ESTIMATES based on historical data. Not guaranteed outcomes.'}{' '}
                  Projection horizon: <span className="font-bold">{result.time_horizon || '30 days'}</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Projected Revenue Impact</h3>
                <div className="flex items-end gap-4 mt-2">
                  <div className="text-4xl font-black text-gray-900">${projectedRev.toLocaleString()}</div>
                  <div className={`flex items-center font-bold pb-1 ${revPctChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revPctChange >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
                    {revPctChange > 0 ? '+' : ''}{revPctChange}%
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Current: ${currentRev.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Confidence Score</div>
                <div className="flex items-center gap-2 justify-end">
                  <div className="w-32 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${confidenceScore}%` }}></div>
                  </div>
                  <span className="font-bold text-gray-700">{confidenceScore}%</span>
                </div>
              </div>
            </div>

            {metricsList.map((metric, idx: number) => {
              const isPositive = metric.pct_change >= 0;
              const isInverse = metric.name.toLowerCase().includes('churn') || metric.name.toLowerCase().includes('unsubscribe');
              const isGood = isInverse ? !isPositive : isPositive;
              
              return (
                <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-sm font-medium text-gray-500 mb-1">{metric.name}</div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{metric.projected}</div>
                      <div className="text-xs text-gray-400 mt-0.5">was {metric.current}</div>
                    </div>
                    <div className={`flex items-center text-sm font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? <TrendingUp className="w-4 h-4 mr-0.5" /> : <TrendingDown className="w-4 h-4 mr-0.5" />}
                      {isPositive ? '+' : ''}{metric.pct_change}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
              <h3 className="text-lg font-bold text-red-800 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" /> Potential Risks
              </h3>
              <ul className="space-y-3">
                {(result.risks || ["No major risks identified."]).map((risk: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-500 mt-0.5">•</span> {risk}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
              <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5" /> Recommendations
              </h3>
              <ul className="space-y-3">
                {(result.recommendations || ["Proceed with caution."]).map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 mt-0.5"><Target className="w-3.5 h-3.5" /></span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
