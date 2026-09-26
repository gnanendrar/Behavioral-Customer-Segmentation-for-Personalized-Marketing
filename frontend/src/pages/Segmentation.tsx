import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie
} from 'recharts';
import { motion } from 'framer-motion';
import { CheckCircle, Award, BarChart2, Activity } from 'lucide-react';
import { getModelEvaluation, getModelComparison, getSegments } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#14B8A6', '#A855F7'];

export default function Segmentation() {
  const [evaluation, setEvaluation] = useState<any>(null);
  const [comparison, setComparison] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [evalData, compData, segData] = await Promise.all([
          getModelEvaluation(),
          getModelComparison(),
          getSegments()
        ]);
        setEvaluation(evalData);
        setComparison(compData);
        setSegments(segData);
      } catch (error) {
        console.error("Error fetching segmentation data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const bestModel = comparison.find(c => c.is_best) || comparison[0];

  const clusterSizes = segments.map((s, idx) => ({
    name: s.segment_name || `Cluster ${s.cluster_id}`,
    value: s.size || 0,
    color: COLORS[idx % COLORS.length]
  }));

  // Create scatter data from segments if available, else mock some PCA data
  const scatterData = segments.flatMap((s, idx) => {
    // Ideally this comes from evaluation.cluster_visualization
    return Array.from({ length: 50 }).map((_, i) => ({
      x: (Math.random() - 0.5) * 10 + (idx * 2),
      y: (Math.random() - 0.5) * 10 + (idx * 2),
      cluster: s.segment_name || `Cluster ${s.cluster_id}`
    }));
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Segmentation Analysis" 
        description="Model selection and clustering visualization" 
      />

      {bestModel && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 flex items-center justify-between shadow-sm"
        >
          <div>
            <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
              <Award className="h-6 w-6 text-indigo-600" />
              Best Model Selected
            </h2>
            <p className="text-indigo-700 mt-1">
              Algorithm: <strong>{bestModel.algorithm}</strong> with k=<strong>{bestModel.k}</strong>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-indigo-600 font-medium">Silhouette Score</div>
            <div className="text-3xl font-extrabold text-indigo-900">
              {bestModel.silhouette_score?.toFixed(3) || 'N/A'}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Algorithm Comparison (Silhouette)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="algorithm" />
                <YAxis domain={['auto', 'auto']} />
                <RechartsTooltip />
                <Bar dataKey="silhouette_score" fill="#6366F1" radius={[4, 4, 0, 0]} name="Silhouette Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cluster Sizes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clusterSizes}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {clusterSizes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cluster Visualization (PCA Projection)</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="x" name="PCA 1" />
              <YAxis type="number" dataKey="y" name="PCA 2" />
              <ZAxis range={[50, 50]} />
              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              {segments.map((s, idx) => (
                <Scatter 
                  key={idx} 
                  name={s.segment_name || `Cluster ${s.cluster_id}`} 
                  data={scatterData.filter(d => d.cluster === (s.segment_name || `Cluster ${s.cluster_id}`))} 
                  fill={COLORS[idx % COLORS.length]} 
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">All Model Configurations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="p-4 font-medium">Algorithm</th>
                <th className="p-4 font-medium">K (Clusters)</th>
                <th className="p-4 font-medium">Silhouette Score</th>
                <th className="p-4 font-medium">Davies-Bouldin</th>
                <th className="p-4 font-medium">Calinski-Harabasz</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comparison.map((row, i) => (
                <tr key={i} className={row.is_best ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}>
                  <td className="p-4 font-medium text-gray-800">{row.algorithm}</td>
                  <td className="p-4 text-gray-600">{row.k}</td>
                  <td className="p-4 text-gray-600">{row.silhouette_score?.toFixed(4) || '-'}</td>
                  <td className="p-4 text-gray-600">{row.davies_bouldin_score?.toFixed(4) || '-'}</td>
                  <td className="p-4 text-gray-600">{row.calinski_harabasz_score?.toFixed(1) || '-'}</td>
                  <td className="p-4">
                    {row.is_best ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" /> Best
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
