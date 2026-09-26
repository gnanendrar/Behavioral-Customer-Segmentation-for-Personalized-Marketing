import { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { getModelEvaluation, getModelComparison, runAnalysis } from '../services/api';
import type { ModelMetrics } from '../types';
import PageHeader from '../components/common/PageHeader';
import { useAppStore } from '../stores/appStore';
import { TruncatedXAxisTick, ModernChartTooltip } from '../components/common/ChartHelpers';

const ModelEvaluation = () => {
  const { setLastUpdated } = useAppStore();
  const [evaluation, setEvaluation] = useState<ModelMetrics | null>(null);
  const [comparison, setComparison] = useState<ModelMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const evalData = await getModelEvaluation();
      const compData = await getModelComparison();
      setEvaluation(evalData);
      setComparison(Array.isArray(compData) ? compData : (compData?.comparison || []));
    } catch (err) {
      console.error('Failed to load model data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunAnalysis = async () => {
    setRunning(true);
    try {
      await runAnalysis();
      setLastUpdated(new Date().toISOString());
      await fetchData();
    } catch (err) {
      console.error('Failed to run analysis', err);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Model Data...</div>;

  const getSilhouetteInterpretation = (score: number) => {
    if (score > 0.7) return "Excellent (Strong structure)";
    if (score > 0.5) return "Good (Reasonable structure)";
    if (score > 0.25) return "Fair (Weak but exists)";
    return "Poor (No substantial structure)";
  };

  const chartData = comparison.map(c => ({
    name: `${c.algorithm} (k=${c.k ?? c.n_clusters ?? ''})`,
    Algorithm: c.algorithm,
    Silhouette: c.silhouette_score ?? 0,
    DaviesBouldin: c.davies_bouldin_score ?? 0
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Model Evaluation" 
          subtitle="Clustering algorithm performance and model selection" 
        />
        <button 
          onClick={handleRunAnalysis} 
          disabled={running}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Running Analysis...' : 'Re-run Analysis'}
        </button>
      </div>

      {evaluation && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold mb-1 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-300" />
                Active Model: {evaluation.algorithm}
              </h2>
              <p className="text-indigo-100 mb-6">Selected automatically based on composite performance rank</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold">{evaluation.k ?? evaluation.n_clusters}</span>
              <p className="text-indigo-100 text-sm">Optimal Clusters</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/10 rounded-lg p-4">
            <div>
              <p className="text-indigo-100 text-xs uppercase tracking-wider mb-1">Silhouette Score</p>
              <p className="text-xl font-semibold">{(evaluation.silhouette_score ?? 0).toFixed(3)}</p>
              <p className="text-xs text-indigo-200 mt-1">{getSilhouetteInterpretation(evaluation.silhouette_score ?? 0)}</p>
            </div>
            <div>
              <p className="text-indigo-100 text-xs uppercase tracking-wider mb-1">Davies-Bouldin</p>
              <p className="text-xl font-semibold">{(evaluation.davies_bouldin_score ?? 0).toFixed(3)}</p>
              <p className="text-xs text-indigo-200 mt-1">Lower is better</p>
            </div>
            <div>
              <p className="text-indigo-100 text-xs uppercase tracking-wider mb-1">Calinski-Harabasz</p>
              <p className="text-xl font-semibold">{(evaluation.calinski_harabasz_score ?? 0).toFixed(0)}</p>
              <p className="text-xs text-indigo-200 mt-1">Higher is better</p>
            </div>
            <div>
              <p className="text-indigo-100 text-xs uppercase tracking-wider mb-1">Features</p>
              <p className="text-xl font-semibold">{evaluation.feature_count || 12}</p>
              <p className="text-xs text-indigo-200 mt-1">Behavioral metrics</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Silhouette Score Comparison</h3>
          <p className="text-sm text-gray-500 mb-4">Higher is better. Measures how similar an object is to its own cluster compared to other clusters.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  interval={0}
                  tick={<TruncatedXAxisTick maxChars={13} angle={-35} />} 
                />
                <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <ModernChartTooltip />
                <Bar dataKey="Silhouette" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.Algorithm === 'kmeans' ? '#6366F1' : '#10B981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Davies-Bouldin Score Comparison</h3>
          <p className="text-sm text-gray-500 mb-4">Lower is better. Measures the ratio of within-cluster scatter to between-cluster separation.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  interval={0}
                  tick={<TruncatedXAxisTick maxChars={13} angle={-35} />} 
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <ModernChartTooltip />
                <Bar dataKey="DaviesBouldin" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.Algorithm === 'kmeans' ? '#F59E0B' : '#EC4899'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-100 overflow-hidden">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Algorithm Configurations Tested</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left font-medium text-gray-500 uppercase">Algorithm</th>
                <th scope="col" className="px-3 py-3 text-center font-medium text-gray-500 uppercase">K (Clusters)</th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase">Silhouette</th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase">Davies-Bouldin</th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase">Calinski-Harabasz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comparison.map((c, i) => {
                const cK = c.k ?? c.n_clusters;
                const evalK = evaluation?.k ?? evaluation?.n_clusters;
                const isActive = evaluation && c.algorithm === evaluation.algorithm && cK === evalK;
                return (
                  <tr key={i} className={isActive ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}>
                    <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-900 flex items-center">
                      {isActive && <CheckCircle className="w-4 h-4 text-indigo-600 mr-2" />}
                      <span className="capitalize">{c.algorithm}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center text-gray-700">{cK ?? 'N/A'}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-right font-medium text-gray-900">{(c.silhouette_score ?? 0).toFixed(4)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-gray-700">{(c.davies_bouldin_score ?? 0).toFixed(4)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-gray-700">{(c.calinski_harabasz_score ?? 0).toFixed(0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModelEvaluation;
