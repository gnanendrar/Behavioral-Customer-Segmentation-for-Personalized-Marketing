import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getRevenueAutopsy, getRevenueForecast } from '../services/api';
import type { RevenueAutopsy, RevenueForecast } from '../types';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { TruncatedXAxisTick, ModernChartTooltip } from '../components/common/ChartHelpers';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#14B8A6', '#A855F7'];

const RevenueIntelligence = () => {
  const [autopsy, setAutopsy] = useState<RevenueAutopsy | null>(null);
  const [forecast, setForecast] = useState<RevenueForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [autopsyData, forecastData] = await Promise.all([
          getRevenueAutopsy(),
          getRevenueForecast(90)
        ]);
        setAutopsy(autopsyData);
        setForecast(forecastData);
      } catch (err) {
        console.error('Failed to load revenue data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Revenue Data...</div>;
  if (!autopsy || !forecast) return <div className="p-8 text-center text-red-500">Failed to load data. Run the analysis pipeline first.</div>;

  const autopsySegments: any[] = autopsy.segments || autopsy.segment_contributions || [];
  const forecastSegments: any[] = forecast.segments || forecast.segment_forecasts || [];

  const totalRev = autopsy.total_revenue || 0;
  const projRev = forecast.total_projected_revenue || 0;
  const growth = totalRev > 0 ? ((projRev - totalRev) / totalRev) * 100 : (forecast.total_growth_pct || 0);
  
  let topSeg = autopsy.top_segment || '';
  let maxSegRev = -1;
  autopsySegments.forEach((s: any) => {
    const rev = s.revenue ?? s.projected_revenue ?? 0;
    if (rev > maxSegRev) {
      maxSegRev = rev;
      topSeg = s.segment_name;
    }
  });

  const pieData = autopsySegments.map((s: any) => ({
    name: s.segment_name,
    value: s.revenue ?? 0
  }));

  const forecastData = forecastSegments.map((s: any) => {
    const current = autopsySegments.find((x: any) => x.segment_name === s.segment_name)?.revenue || 0;
    const projected = s.projected_revenue ?? 0;
    return {
      name: s.segment_name,
      Current: current,
      Projected: projected,
      growth: s.growth_rate_pct !== undefined ? s.growth_rate_pct : (current > 0 ? ((projected - current) / current) * 100 : 0)
    };
  }).sort((a: any, b: any) => b.Projected - a.Projected);

  const getGrowthBadge = (g: number) => {
    if (g > 5) return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Strong Growth</span>;
    if (g < -5) return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">Decline</span>;
    return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">Stable</span>;
  };

  const giniCoeff = autopsy.gini_coefficient ?? autopsy.revenue_concentration ?? 0;

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
          value={topSeg || 'N/A'} 
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
        {/* Revenue Breakdown Donut with Clean Legend */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-semibold text-gray-800">Revenue Breakdown</h3>
              <span className="text-xs font-semibold text-gray-500">${totalRev.toLocaleString(undefined, {maximumFractionDigits:0})} total</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">Financial volume distribution across behavioral segments</p>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Donut with center text */}
              <div className="sm:col-span-6 h-60 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={58}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ModernChartTooltip isCurrency={true} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-black text-gray-800">${(totalRev / 1000).toFixed(0)}k</span>
                  <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Revenue</span>
                </div>
              </div>

              {/* Side Breakdown List (No overlapping text) */}
              <div className="sm:col-span-6 space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {pieData.map((item, idx) => {
                  const pct = totalRev > 0 ? ((item.value / totalRev) * 100).toFixed(1) : '0';
                  return (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-xs font-medium text-gray-700 truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-800">${(item.value / 1000).toFixed(0)}k</span>
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100">
            <strong>Concentration Insight:</strong> The Gini coefficient is {giniCoeff.toFixed(2)}. 
            {giniCoeff > 0.6 ? " Revenue is heavily concentrated in top segments — consider diversification." : " Revenue is healthy and distributed across multiple segments."}
          </div>
        </div>

        {/* Current vs Projected Revenue Bar Chart with Truncated XAxis */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-1 text-gray-800">Current vs Projected Revenue</h3>
          <p className="text-xs text-gray-400 mb-4">90-day forward growth projections by cluster</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={forecastData} 
                margin={{ top: 10, right: 20, left: 10, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  interval={0}
                  tick={<TruncatedXAxisTick maxChars={14} angle={-35} />} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} 
                />
                <ModernChartTooltip isCurrency={true} />
                <Legend wrapperStyle={{ paddingTop: 14, fontSize: '12px' }} />
                <Bar dataKey="Current" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Projected" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Segment Growth Forecast</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Segment</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Current Rev</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Projected Rev</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Growth %</th>
                <th scope="col" className="px-4 py-3 text-center font-medium text-gray-500 uppercase">Outlook</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forecastData.map((s, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-right text-gray-600">${s.Current.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                  <td className="px-4 py-3 text-right text-gray-900 font-bold">${s.Projected.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${s.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {s.growth > 0 ? '+' : ''}{s.growth.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">{getGrowthBadge(s.growth)}</td>
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
