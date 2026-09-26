import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getRevenueAutopsy, getRevenueForecast } from '../services/api';
import { RevenueAutopsy, RevenueForecast } from '../types';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#14B8A6', '#A855F7'];

const RevenueIntelligence: React.FC = () => {
  const [autopsy, setAutopsy] = useState<RevenueAutopsy | null>(null);
  const [forecast, setForecast] = useState<RevenueForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [aData, fData] = await Promise.all([
          getRevenueAutopsy(),
          getRevenueForecast()
        ]);
        setAutopsy(aData);
        setForecast(fData);
      } catch (err) {
        console.error('Failed to load revenue data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Revenue Data...</div>;
  if (!autopsy || !forecast) return <div className="p-8 text-center text-red-500">Failed to load data.</div>;

  const totalRev = autopsy.total_revenue;
  const projRev = forecast.total_projected_revenue;
  const growth = totalRev > 0 ? ((projRev - totalRev) / totalRev) * 100 : 0;
  
  let topSeg = '';
  let maxSegRev = -1;
  autopsy.segments.forEach(s => {
    if (s.revenue > maxSegRev) {
      maxSegRev = s.revenue;
      topSeg = s.segment_name;
    }
  });

  const pieData = autopsy.segments.map(s => ({
    name: s.segment_name,
    value: s.revenue
  }));

  const forecastData = forecast.segments.map(s => {
    const current = autopsy.segments.find(x => x.segment_name === s.segment_name)?.revenue || 0;
    return {
      name: s.segment_name,
      Current: current,
      Projected: s.projected_revenue,
      growth: current > 0 ? ((s.projected_revenue - current) / current) * 100 : 0
    };
  }).sort((a, b) => b.Projected - a.Projected);

  const getGrowthBadge = (g: number) => {
    if (g > 5) return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Strong Growth</span>;
    if (g < -5) return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Decline</span>;
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Stable</span>;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Revenue Intelligence" 
        subtitle="Revenue autopsy and forecasting by segment" 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRev.toLocaleString(undefined, {maximumFractionDigits:0})}`} 
          icon={<DollarSign className="text-blue-500" />} 
        />
        <StatCard 
          title="Projected Revenue" 
          value={`$${projRev.toLocaleString(undefined, {maximumFractionDigits:0})}`} 
          icon={<TrendingUp className="text-purple-500" />} 
        />
        <StatCard 
          title="Projected Growth" 
          value={`${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`} 
          icon={<PieChartIcon className={growth >= 0 ? 'text-green-500' : 'text-red-500'} />} 
        />
        <StatCard 
          title="Top Segment" 
          value={topSeg} 
          icon={<AlertTriangle className="text-yellow-500" />} 
        />
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700 font-medium">
              FORECAST — Statistical projections based on behavioral trends
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Revenue Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm text-gray-700">
            <strong>Concentration Insight:</strong> The Gini coefficient for revenue is {(autopsy.gini_coefficient || 0).toFixed(2)}. 
            {autopsy.gini_coefficient > 0.6 ? " Revenue is highly concentrated among top segments, indicating risk if these customers churn." : " Revenue is relatively well-distributed across segments."}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Current vs Projected Revenue</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fontSize: 12}} />
                <YAxis tickFormatter={(val) => `$${(val/1000)}k`} />
                <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Current" fill="#6366F1" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Projected" fill="#10B981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Segment Growth Forecast</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left font-medium text-gray-500 uppercase">Segment</th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase">Current Rev</th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase">Projected Rev</th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase">Growth %</th>
                <th scope="col" className="px-3 py-3 text-center font-medium text-gray-500 uppercase">Outlook</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {forecastData.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap font-medium text-gray-900">{d.name}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-right text-gray-600">${d.Current.toLocaleString()}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-right font-medium text-gray-900">${d.Projected.toLocaleString()}</td>
                  <td className={`px-3 py-4 whitespace-nowrap text-right font-medium ${d.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {d.growth > 0 ? '+' : ''}{d.growth.toFixed(1)}%
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-center">
                    {getGrowthBadge(d.growth)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default RevenueIntelligence;
