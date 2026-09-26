import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getSegments, getTransitions } from '../services/api';
import { Segment, TransitionInfo } from '../types';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import useAppStore from '../stores/appStore';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#14B8A6', '#A855F7'];

const BehaviorJourney: React.FC = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [transitions, setTransitions] = useState<TransitionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const segData = await getSegments();
        const transData = await getTransitions();
        setSegments(segData);
        setTransitions(transData);
      } catch (err) {
        console.error('Failed to load journey data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalTransitions = transitions.reduce((sum, t) => sum + t.count, 0);
  const upgrades = transitions.filter(t => t.direction === 'upgrade').reduce((sum, t) => sum + t.count, 0);
  const downgrades = transitions.filter(t => t.direction === 'downgrade').reduce((sum, t) => sum + t.count, 0);

  // Segment growth mock for chart
  const segmentGrowthData = segments.map((s, i) => {
    const inflow = transitions.filter(t => t.to_segment === s.name).reduce((sum, t) => sum + t.count, 0);
    const outflow = transitions.filter(t => t.from_segment === s.name).reduce((sum, t) => sum + t.count, 0);
    return {
      name: s.name,
      netChange: inflow - outflow,
      inflow,
      outflow
    };
  }).sort((a, b) => b.netChange - a.netChange);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Behavior Journey" 
        subtitle="How customers move between segments" 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Transitions" 
          value={totalTransitions.toString()} 
          icon={<RefreshCcw className="text-blue-500" />} 
        />
        <StatCard 
          title="Upgrades" 
          value={upgrades.toString()} 
          icon={<TrendingUp className="text-green-500" />} 
        />
        <StatCard 
          title="Downgrades" 
          value={dowgrades.toString()} 
          icon={<TrendingDown className="text-red-500" />} 
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Lifecycle Flow</h3>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 py-8 overflow-x-auto">
          {segments.map((seg, i) => (
            <React.Fragment key={seg.id}>
              <div className="flex flex-col items-center bg-gray-50 border-2 border-indigo-100 rounded-lg p-4 min-w-[150px] shadow-sm text-center">
                <span className="font-semibold text-gray-800">{seg.name}</span>
                <span className="text-xs text-gray-500 mt-1">{seg.customer_count} users</span>
              </div>
              {i < segments.length - 1 && (
                <div className="flex flex-col items-center px-2">
                  <ArrowRight className="text-gray-300 w-6 h-6 hidden md:block" />
                  <TrendingDown className="text-gray-300 w-6 h-6 md:hidden" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-sm text-gray-500 text-center mt-4">Simplified view of major segment transitions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Segment Growth/Decline</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={segmentGrowthData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
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
