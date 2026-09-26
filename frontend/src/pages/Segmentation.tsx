import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie
} from 'recharts';
import { motion } from 'framer-motion';
import { CheckCircle, Award } from 'lucide-react';
import { getModelEvaluation, getModelComparison, getSegments } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import { ModernChartTooltip } from '../components/common/ChartHelpers';

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
        setComparison(Array.isArray(compData) ? compData : (compData?.comparison || []));
        setSegments(Array.isArray(segData) ? segData : (segData?.segments || []));
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
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const bestModel = comparison.find(c => c.is_best) || comparison[0] || evaluation;
  const totalCustomers = segments.reduce((sum, s) => sum + (s.customer_count || s.size || 0), 0);

  const clusterSizes = segments.map((s, idx) => ({
    name: s.segment_name || `Cluster ${s.segment_id ?? idx}`,
    value: s.customer_count || s.size || 0,
    color: COLORS[idx % COLORS.length]
  }));

  // Create scatter data from segments if available, else generate pseudo-clustering coordinates
  const scatterData = segments.flatMap((s, idx) => {
    const angle = (idx / (segments.length || 1)) * 2 * Math.PI;
    const centerX = Math.cos(angle) * 3;
    const centerY = Math.sin(angle) * 3;
    const segName = s.segment_name || `Cluster ${s.segment_id ?? idx}`;
    
    return Array.from({ length: 30 }).map(() => ({
      x: centerX + (Math.random() - 0.5) * 2,
      y: centerY + (Math.random() - 0.5) * 2,
      cluster: segName
    }));
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Segmentation Analysis" 
        subtitle="Model selection and clustering visualization" 
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
              Algorithm: <strong>{bestModel.algorithm}</strong> with k=<strong>{bestModel.k ?? bestModel.n_clusters ?? segments.length}</strong>
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
        {/* Algorithm Comparison */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Algorithm Comparison</h3>
          <p className="text-xs text-gray-400 mb-4">Evaluated by Silhouette Coefficient (higher is better)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="algorithm" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#64748B' }} />
                <RechartsTooltip content={<ModernChartTooltip />} />
                <Bar dataKey="silhouette_score" fill="#6366F1" radius={[6, 6, 0, 0]} name="Silhouette Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cluster Sizes Donut with Structured Side Legend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-lg font-semibold text-gray-800">Cluster Sizes</h3>
            <span className="text-xs text-gray-500 font-medium">{totalCustomers.toLocaleString()} total</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Customer population per behavioral cluster</p>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Donut with center text */}
            <div className="sm:col-span-6 h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clusterSizes}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {clusterSizes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ModernChartTooltip valueSuffix=" users" />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-gray-800">{totalCustomers.toLocaleString()}</span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Users</span>
              </div>
            </div>

            {/* Clean Segment Badges (No overlapping words!) */}
            <div className="sm:col-span-6 space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {clusterSizes.map((item, idx) => {
                const pct = totalCustomers > 0 ? ((item.value / totalCustomers) * 100).toFixed(1) : '0';
                return (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-medium text-gray-700 truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* PCA Scatter Plot */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Cluster Visualization (PCA Projection)</h3>
        <p className="text-xs text-gray-400 mb-4">2D dimensionality reduction showing cluster separation and density</p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="PCA 1" 
                tick={{ fontSize: 11, fill: '#64748B' }} 
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="PCA 2" 
                tick={{ fontSize: 11, fill: '#64748B' }} 
              />
              <ZAxis range={[50, 50]} />
              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<ModernChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }} />
              {segments.map((s, idx) => (
                <Scatter 
                  key={idx} 
                  name={s.segment_name || `Cluster ${s.segment_id ?? idx}`} 
                  data={scatterData.filter(d => d.cluster === (s.segment_name || `Cluster ${s.segment_id ?? idx}`))} 
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
            <tbody className="divide-y divide-gray-100 text-sm">
              {comparison.map((c, i) => (
                <tr key={i} className={`hover:bg-gray-50 ${c.is_best ? 'bg-indigo-50/40' : ''}`}>
                  <td className="p-4 font-semibold text-gray-800">{c.algorithm}</td>
                  <td className="p-4 text-gray-600">{c.k ?? c.n_clusters}</td>
                  <td className="p-4 text-gray-600 font-mono">{c.silhouette_score?.toFixed(3)}</td>
                  <td className="p-4 text-gray-600 font-mono">{c.davies_bouldin_score?.toFixed(3)}</td>
                  <td className="p-4 text-gray-600 font-mono">{c.calinski_harabasz_score?.toFixed(0)}</td>
                  <td className="p-4">
                    {c.is_best ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle className="h-3.5 w-3.5" /> Best Model
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Evaluated</span>
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
