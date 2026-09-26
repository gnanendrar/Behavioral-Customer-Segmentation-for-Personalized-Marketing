import { useState, useEffect } from 'react';
import { Users, Star, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { getCohorts } from '../services/api';
import type { CohortData } from '../types';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { TruncatedXAxisTick, ModernChartTooltip } from '../components/common/ChartHelpers';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#14B8A6', '#A855F7'];

const CohortAnalysis = () => {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCohorts = async () => {
      setLoading(true);
      try {
        const data = await getCohorts();
        const list = Array.isArray(data) ? data : (data?.cohorts || []);
        setCohorts(list);
      } catch (err) {
        console.error('Failed to load cohort data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCohorts();
  }, []);

  const sortedCohorts = [...cohorts].sort((a, b) => (a.cohort_name || '').localeCompare(b.cohort_name || ''));
  
  const totalCohorts = cohorts.length;
  const latestCohort = sortedCohorts.length > 0 ? sortedCohorts[sortedCohorts.length - 1] : null;
  
  let bestCohort = sortedCohorts[0];
  sortedCohorts.forEach(c => {
    if ((c.avg_value_score || 0) > (bestCohort?.avg_value_score || 0)) {
      bestCohort = c;
    }
  });

  const getCellColor = (val: number, max: number, min: number, inverted: boolean = false) => {
    if (max === min) return 'text-gray-900';
    const ratio = (val - min) / (max - min || 1);
    const score = inverted ? 1 - ratio : ratio;
    
    if (score >= 0.7) return 'text-green-600 font-medium';
    if (score <= 0.3) return 'text-red-600 font-medium';
    return 'text-gray-700';
  };

  const chartData = sortedCohorts.map(c => ({
    name: c.cohort_name,
    Value: Number(c.avg_value_score || 0).toFixed(2),
    Engagement: Number(c.avg_engagement_score ?? c.avg_engagement ?? 0).toFixed(2),
    Risk: Number(c.avg_churn_risk || 0).toFixed(2)
  }));

  const allSegments = new Set<string>();
  sortedCohorts.forEach(c => {
    if (c.segment_distribution) {
      Object.keys(c.segment_distribution).forEach(seg => allSegments.add(seg));
    }
  });

  const segDistData = sortedCohorts.map(c => {
    const obj: any = { name: c.cohort_name };
    if (c.segment_distribution) {
      Object.entries(c.segment_distribution).forEach(([seg, pct]) => {
        obj[seg] = pct;
      });
    }
    return obj;
  });

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
        title="Cohort Analysis" 
        subtitle="Compare customer behaviors across different signup periods" 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Cohorts" 
          value={totalCohorts.toString()} 
          icon={<Users className="text-blue-500" />} 
        />
        <StatCard 
          title="Latest Cohort" 
          value={latestCohort?.cohort_name || 'N/A'} 
          icon={<TrendingUp className="text-purple-500" />} 
        />
        <StatCard 
          title="Top Performing Cohort" 
          value={bestCohort?.cohort_name || 'N/A'} 
          icon={<Star className="text-yellow-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Behavioral Score Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 25, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <ModernChartTooltip valueSuffix="/100" />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: '12px' }} />
                <Line type="monotone" dataKey="Value" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Engagement" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Risk" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Segment Distribution by Cohort</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segDistData} margin={{ top: 10, right: 25, left: 10, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  interval={0}
                  tick={<TruncatedXAxisTick maxChars={12} angle={-35} />} 
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v}%`} />
                <ModernChartTooltip valueSuffix="%" />
                <Legend wrapperStyle={{ paddingTop: 12, fontSize: '11px' }} />
                {Array.from(allSegments).map((seg, idx) => (
                  <Bar key={seg} dataKey={seg} stackId="a" fill={COLORS[idx % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-100 overflow-hidden">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Cohort Comparison Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Cohort</th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Avg Value</th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Avg Engagement</th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Avg Risk</th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Avg Spend</th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Retention %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedCohorts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4 text-gray-500">No cohorts available. Run the analysis pipeline first.</td></tr>
              ) : (
                sortedCohorts.map((c, i) => {
                  const valMax = Math.max(...sortedCohorts.map(x => x.avg_value_score || 0), 1);
                  const valMin = Math.min(...sortedCohorts.map(x => x.avg_value_score || 0), 0);
                  const riskMax = Math.max(...sortedCohorts.map(x => x.avg_churn_risk || 0), 1);
                  const riskMin = Math.min(...sortedCohorts.map(x => x.avg_churn_risk || 0), 0);
                  const retMax = Math.max(...sortedCohorts.map(x => (x as any).retention_rate || 0), 1);
                  const retMin = Math.min(...sortedCohorts.map(x => (x as any).retention_rate || 0), 0);
                  const spend = (c as any).avg_spend ?? (c as any).avg_spending ?? 0;
                  const retRate = (c as any).retention_rate ?? 0;

                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-900">{c.cohort_name}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-gray-700">{c.customer_count}</td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right ${getCellColor(c.avg_value_score, valMax, valMin)}`}>
                        {Number(c.avg_value_score || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-gray-700">
                        {Number(c.avg_engagement_score ?? c.avg_engagement ?? 0).toFixed(2)}
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right ${getCellColor(c.avg_churn_risk, riskMax, riskMin, true)}`}>
                        {Number(c.avg_churn_risk || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-gray-700">
                        ${Number(spend).toFixed(2)}
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right ${getCellColor(retRate, retMax, retMin)}`}>
                        {(Number(retRate) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CohortAnalysis;
