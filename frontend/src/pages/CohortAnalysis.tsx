import React, { useState, useEffect } from 'react';
import { Users, BarChart2, Star, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getCohorts } from '../services/api';
import { CohortData } from '../types';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#14B8A6', '#A855F7'];

const CohortAnalysis: React.FC = () => {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCohorts = async () => {
      setLoading(true);
      try {
        const data = await getCohorts();
        setCohorts(data);
      } catch (err) {
        console.error('Failed to load cohort data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCohorts();
  }, []);

  const sortedCohorts = [...cohorts].sort((a, b) => a.cohort_name.localeCompare(b.cohort_name));
  
  const totalCohorts = cohorts.length;
  const latestCohort = sortedCohorts.length > 0 ? sortedCohorts[sortedCohorts.length - 1] : null;
  
  let bestCohort = sortedCohorts[0];
  sortedCohorts.forEach(c => {
    if (c.avg_value_score > (bestCohort?.avg_value_score || 0)) {
      bestCohort = c;
    }
  });

  const getCellColor = (val: number, max: number, min: number, inverted: boolean = false) => {
    if (max === min) return 'text-gray-900';
    const ratio = (val - min) / (max - min);
    const score = inverted ? 1 - ratio : ratio;
    
    if (score >= 0.7) return 'text-green-600 font-medium';
    if (score <= 0.3) return 'text-red-600 font-medium';
    return 'text-gray-700';
  };

  const chartData = sortedCohorts.map(c => ({
    name: c.cohort_name,
    Value: c.avg_value_score.toFixed(2),
    Engagement: c.avg_engagement.toFixed(2),
    Risk: c.avg_churn_risk.toFixed(2)
  }));

  const segDistData = sortedCohorts.map(c => {
    const obj: any = { name: c.cohort_name };
    Object.keys(c.segment_distribution).forEach(k => {
      obj[k] = (c.segment_distribution[k] / c.customer_count) * 100;
    });
    return obj;
  });

  const allSegments = new Set<string>();
  sortedCohorts.forEach(c => {
    Object.keys(c.segment_distribution).forEach(k => allSegments.add(k));
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Cohort Analysis" 
        subtitle="Compare customer cohorts by signup period" 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Cohorts" 
          value={totalCohorts.toString()} 
          icon={<Users className="text-blue-500" />} 
        />
        <StatCard 
          title="Latest Cohort Value" 
          value={latestCohort ? latestCohort.avg_value_score.toFixed(2) : 'N/A'} 
          icon={<TrendingUp className="text-green-500" />} 
        />
        <StatCard 
          title="Best Performing Cohort" 
          value={bestCohort ? bestCohort.cohort_name : 'N/A'} 
          icon={<Star className="text-yellow-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Cohort Trends (Scores)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="Value" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Engagement" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Risk" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Segment Distribution per Cohort (%)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segDistData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip formatter={(val: number) => [`${val.toFixed(1)}%`, undefined]} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                {Array.from(allSegments).map((seg, idx) => (
                  <Bar key={seg} dataKey={seg} stackId="a" fill={COLORS[idx % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-100 overflow-hidden">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Cohort Comparison</h3>
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
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
              ) : (
                sortedCohorts.map((c, i) => {
                  const valMax = Math.max(...sortedCohorts.map(x => x.avg_value_score));
                  const valMin = Math.min(...sortedCohorts.map(x => x.avg_value_score));
                  const riskMax = Math.max(...sortedCohorts.map(x => x.avg_churn_risk));
                  const riskMin = Math.min(...sortedCohorts.map(x => x.avg_churn_risk));
                  const retMax = Math.max(...sortedCohorts.map(x => x.retention_rate));
                  const retMin = Math.min(...sortedCohorts.map(x => x.retention_rate));

                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-900">{c.cohort_name}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-gray-700">{c.customer_count}</td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right ${getCellColor(c.avg_value_score, valMax, valMin)}`}>
                        {c.avg_value_score.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-gray-700">
                        {c.avg_engagement.toFixed(2)}
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right ${getCellColor(c.avg_churn_risk, riskMax, riskMin, true)}`}>
                        {c.avg_churn_risk.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-gray-700">
                        ${c.avg_spend.toFixed(2)}
                      </td>
                      <td className={`px-3 py-3 whitespace-nowrap text-right ${getCellColor(c.retention_rate, retMax, retMin)}`}>
                        {(c.retention_rate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  )
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
