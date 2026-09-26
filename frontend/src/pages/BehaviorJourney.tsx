import { useState, useEffect, Fragment } from 'react';
import { ArrowRight, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { getSegments, getTransitions } from '../services/api';
import type { Segment, TransitionInfo } from '../types';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { TruncatedXAxisTick, ModernChartTooltip } from '../components/common/ChartHelpers';

const BehaviorJourney = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [transitions, setTransitions] = useState<TransitionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const segData = await getSegments();
        const transData = await getTransitions();
        const segList = Array.isArray(segData) ? segData : (segData?.segments || []);
        const rawTrans = Array.isArray(transData) ? transData : (transData?.transitions || transData?.flow_data || []);
        
        // Normalize transitions so from_segment and to_segment use names
        const normalizedTransitions: TransitionInfo[] = rawTrans.map((t: any) => {
          const fromName = t.from_segment_name || (typeof t.from_segment === 'number' ? segList.find((s: any) => s.segment_id === t.from_segment)?.segment_name : t.from_segment) || `Segment ${t.from_segment}`;
          const toName = t.to_segment_name || (typeof t.to_segment === 'number' ? segList.find((s: any) => s.segment_id === t.to_segment)?.segment_name : t.to_segment) || `Segment ${t.to_segment}`;
          const count = t.count ?? t.estimated_count ?? 0;
          return {
            from_segment: fromName,
            to_segment: toName,
            count,
            direction: t.direction || 'upgrade',
          };
        });

        setSegments(segList);
        setTransitions(normalizedTransitions);
      } catch (err) {
        console.error('Failed to load journey data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalTransitions = transitions.reduce((sum, t) => sum + (t.count || 0), 0);
  const upgrades = transitions.filter(t => t.direction === 'upgrade').reduce((sum, t) => sum + (t.count || 0), 0);
  const downgrades = transitions.filter(t => t.direction === 'downgrade').reduce((sum, t) => sum + (t.count || 0), 0);

  // Segment growth mock for chart
  const segmentGrowthData = segments.map((s) => {
    const sName = s.segment_name || s.name || `Segment ${s.segment_id}`;
    const inflow = transitions.filter(t => t.to_segment === sName).reduce((sum, t) => sum + (t.count || 0), 0);
    const outflow = transitions.filter(t => t.from_segment === sName).reduce((sum, t) => sum + (t.count || 0), 0);
    return {
      name: sName,
      netChange: inflow - outflow,
      inflow,
      outflow
    };
  }).sort((a, b) => b.netChange - a.netChange);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Behavior Journey" 
        subtitle="How customers move between segments over time" 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Transitions" 
          value={totalTransitions.toLocaleString()} 
          icon={<RefreshCcw className="text-blue-500" />} 
        />
        <StatCard 
          title="Upgrades" 
          value={upgrades.toLocaleString()} 
          icon={<TrendingUp className="text-green-500" />} 
        />
        <StatCard 
          title="Downgrades" 
          value={downgrades.toLocaleString()} 
          icon={<TrendingDown className="text-red-500" />} 
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-1 text-gray-800">Lifecycle Flow</h3>
        <p className="text-xs text-gray-400 mb-6">Customer progression and migration paths across behavioral stages</p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 py-4 overflow-x-auto">
          {segments.map((seg, i) => (
            <Fragment key={seg.segment_id ?? seg.id ?? i}>
              <div className="flex flex-col items-center bg-white border border-indigo-100 hover:border-indigo-300 rounded-xl p-4 min-w-[175px] max-w-[210px] shadow-sm text-center transition-all">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mb-2" />
                <span className="font-semibold text-gray-800 text-xs leading-snug line-clamp-2" title={seg.segment_name || seg.name}>
                  {seg.segment_name || seg.name}
                </span>
                <span className="text-[11px] text-gray-500 mt-1.5 font-medium bg-gray-50 px-2 py-0.5 rounded-full">
                  {(seg.customer_count ?? 0).toLocaleString()} users
                </span>
              </div>
              {i < segments.length - 1 && (
                <div className="flex flex-col items-center px-2">
                  <ArrowRight className="text-indigo-300 w-5 h-5 hidden md:block" />
                  <TrendingDown className="text-indigo-300 w-5 h-5 md:hidden" />
                </div>
              )}
            </Fragment>
          ))}
          {segments.length === 0 && (
            <p className="text-gray-500 text-sm">No segments available. Run the analysis pipeline first.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-1 text-gray-800">Segment Growth/Decline</h3>
          <p className="text-xs text-gray-400 mb-4">Net movement balance between upgrades and downgrades</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={segmentGrowthData}
                margin={{ top: 10, right: 25, left: 10, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  interval={0}
                  tick={<TruncatedXAxisTick maxChars={14} angle={-35} />} 
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <ModernChartTooltip valueSuffix=" users" />
                <Bar dataKey="netChange" radius={[4, 4, 0, 0]}>
                  {segmentGrowthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.netChange >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Transition Details</h3>
          <div className="overflow-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th scope="col" className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">To</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  <th scope="col" className="px-3 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transitions.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-4 text-gray-500">No transition data available</td></tr>
                ) : (
                  transitions.map((t, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap text-gray-700">{t.from_segment}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-700 font-medium">{t.to_segment}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-gray-900">{t.count}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${t.direction === 'upgrade' ? 'bg-green-100 text-green-800' : 
                            t.direction === 'downgrade' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {t.direction}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BehaviorJourney;
