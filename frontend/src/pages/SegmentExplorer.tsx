import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, DollarSign, Activity, ChevronRight, X, 
  Target, Zap, Heart
} from 'lucide-react';
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, 
  ResponsiveContainer, Tooltip 
} from 'recharts';
import { getSegments } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import type { Segment } from '../types';

const SegmentExplorer = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const data = await getSegments();
        const segList = data.segments || (Array.isArray(data) ? data : []);
        setSegments(segList);
      } catch (err: any) {
        setError(err.message || 'Failed to load segments');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSegments();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || segments.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        No segments available. Please run the analysis pipeline first.
      </div>
    );
  }

  const maxCustomers = Math.max(...segments.map(s => s.customer_count || 1), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Segment Explorer" 
        subtitle="Deep dive into AI-generated behavioral clusters"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Segments Grid */}
        <div className={`grid gap-6 ${selectedSegment ? 'lg:col-span-1' : 'lg:col-span-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {segments.map((segment) => {
            const monetaryValue = segment.avg_order_value ?? segment.metrics?.monetary_value ?? segment.avg_value_score ?? 0;
            const engagementScore = segment.avg_engagement_score ?? segment.metrics?.engagement_score ?? 0;
            const chars = segment.key_characteristics || segment.characteristics || [];

            return (
              <motion.div 
                key={segment.segment_id}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedSegment(segment)}
                className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer transition-all
                  ${selectedSegment?.segment_id === segment.segment_id ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-slate-200 hover:border-indigo-300'}
                `}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1" title={segment.segment_name}>{segment.segment_name}</h3>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                    {(segment.customer_count || 0).toLocaleString()} users
                  </span>
                </div>
                
                <div className="mb-4">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${Math.min(100, Math.max(5, ((segment.customer_count || 0) / maxCustomers) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> 
                    <span className="font-medium text-slate-700">${monetaryValue.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Activity className="w-4 h-4 text-blue-500" /> 
                    <span className="font-medium text-slate-700">{engagementScore.toFixed(1)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  {chars.slice(0, 2).map((char: string, idx: number) => (
                    <p key={idx} className="text-xs text-slate-500 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                      <span className="line-clamp-1">{char}</span>
                    </p>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm text-indigo-600 font-medium group">
                  <span>View Profile</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selectedSegment && (() => {
          const monetaryValue = selectedSegment.avg_order_value ?? selectedSegment.metrics?.monetary_value ?? selectedSegment.avg_value_score ?? 0;
          const engagementScore = selectedSegment.avg_engagement_score ?? selectedSegment.metrics?.engagement_score ?? 0;
          const churnRisk = selectedSegment.avg_churn_risk ?? selectedSegment.metrics?.churn_probability ?? 0;
          const loyaltyScore = selectedSegment.avg_loyalty_score ?? selectedSegment.metrics?.loyalty_index ?? 0;
          const chars = selectedSegment.key_characteristics || selectedSegment.characteristics || [];

          return (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedSegment.segment_name}</h2>
                  <p className="text-slate-500 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {(selectedSegment.customer_count || 0).toLocaleString()} Customers</span>
                    <span className="flex items-center gap-1"><Target className="w-4 h-4" /> ID: {selectedSegment.segment_id}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSegment(null)}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Behavioral Footprint</h3>
                    <div className="h-64 bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart 
                          outerRadius="55%" 
                          margin={{ top: 15, right: 25, bottom: 15, left: 25 }}
                          data={[
                            { metric: 'Value', A: monetaryValue, fullMark: 100 },
                            { metric: 'Engagement', A: engagementScore, fullMark: 100 },
                            { metric: 'Loyalty', A: loyaltyScore, fullMark: 100 },
                            { metric: 'Retention', A: Math.max(0, 100 - churnRisk), fullMark: 100 },
                          ]}
                        >
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                          <Radar name={selectedSegment.segment_name} dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.5} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" /> Key Characteristics
                      </h3>
                      <ul className="space-y-2">
                        {chars.map((char: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="mt-0.5">•</span>
                            {char}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500" /> Marketing Recommendation
                      </h3>
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-900 leading-relaxed font-medium">
                        {selectedSegment.marketing_action || selectedSegment.behavioral_summary || 'Engage with personalized offers based on recent activity to maximize retention.'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="text-xs text-slate-500 mb-1">Avg Order Value</div>
                    <div className="text-xl font-bold text-slate-800">${monetaryValue.toFixed(2)}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="text-xs text-slate-500 mb-1">Engagement Score</div>
                    <div className="text-xl font-bold text-slate-800">{engagementScore.toFixed(1)}/100</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="text-xs text-slate-500 mb-1">Churn Risk</div>
                    <div className="text-xl font-bold text-slate-800">{churnRisk.toFixed(1)}%</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="text-xs text-slate-500 mb-1">Loyalty Index</div>
                    <div className="text-xl font-bold text-slate-800">{loyaltyScore.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </div>
    </div>
  );
};

export default SegmentExplorer;
