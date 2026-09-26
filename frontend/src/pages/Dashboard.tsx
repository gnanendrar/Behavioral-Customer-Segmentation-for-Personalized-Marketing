import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, DollarSign, AlertTriangle, Target, 
  Award, ArrowRight, BarChart3 
} from 'lucide-react';
import { getAppStatus, getSegments, getAlerts } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { TruncatedYAxisTick, ModernChartTooltip } from '../components/common/ChartHelpers';
import type { Segment, Alert } from '../types';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#14B8A6', '#A855F7'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const appStatus = await getAppStatus();
        setStatus(appStatus);

        if (appStatus.has_analysis) {
          const [segmentsData, alertsData] = await Promise.all([
            getSegments(),
            getAlerts()
          ]);
          const segList = Array.isArray(segmentsData) ? segmentsData : (segmentsData?.segments || []);
          const alertList = Array.isArray(alertsData) ? alertsData : (alertsData?.alerts || []);
          setSegments(segList);
          setAlerts(alertList);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!status?.has_analysis) {
    return (
      <div className="p-6 max-w-4xl mx-auto mt-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No Analysis Data Yet</h2>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto">
            Upload your customer dataset or generate a synthetic demo dataset to start uncovering behavioral insights.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Upload Data
            </button>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Generate Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate KPIs
  const totalCustomers = segments.reduce((sum, s) => sum + (s.customer_count || 0), 0);
  const totalRevenue = segments.reduce((sum, s) => sum + (s.revenue_contribution || (s.avg_order_value ? s.avg_order_value * s.customer_count : 0)), 0);
  const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  
  const pieData = segments.map(s => ({ name: s.segment_name, value: s.customer_count || 0 }));
  const revenueData = segments.map(s => ({ 
    name: s.segment_name, 
    revenue: s.revenue_contribution || (s.avg_order_value ? s.avg_order_value * s.customer_count : 0)
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const radarData = segments.slice(0, 3).map(s => ({
    name: s.segment_name,
    Value: s.avg_value_score || 0,
    Engagement: s.avg_engagement_score || 0,
    Loyalty: s.avg_loyalty_score || 0,
    Activity: s.avg_purchase_frequency || 0,
  }));
  
  const radarMetrics = ['Value', 'Engagement', 'Loyalty', 'Activity'];
  const formattedRadarData = radarMetrics.map(metric => {
    const row: any = { metric };
    radarData.forEach(s => {
      row[s.name] = s[metric as keyof typeof s];
    });
    return row;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Dashboard Overview" 
        subtitle="High-level view of your customer behavioral landscape"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Customers" value={totalCustomers.toLocaleString()} icon={<Users />} trend="+12%" trendUp={true} />
        <StatCard title="Total Revenue" value={`$${(totalRevenue/1000).toFixed(1)}k`} icon={<DollarSign />} trend="+8%" trendUp={true} />
        <StatCard title="Avg Customer Value" value={`$${avgCustomerValue.toFixed(2)}`} icon={<Award />} />
        <StatCard title="Segments Identified" value={segments.length.toString()} icon={<Target />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Key Insights & Alerts
            </h3>
            <div className="space-y-3">
              {alerts.slice(0, 4).map((alert, idx) => (
                <div key={idx} className={`p-3.5 rounded-xl border-l-4 ${
                  alert.severity === 'high' ? 'border-red-500 bg-red-50/80' : 
                  alert.severity === 'medium' ? 'border-amber-500 bg-amber-50/80' : 
                  'border-blue-500 bg-blue-50/80'
                }`}>
                  <p className="font-semibold text-slate-900 text-xs mb-1">{alert.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-slate-500 text-sm">No active alerts.</p>
              )}
            </div>
          </div>
          <button 
            onClick={() => navigate('/marketing')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-800 transition-colors"
          >
            View all insights <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Population Donut Chart with Clean Side Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-slate-800">Segment Population Distribution</h3>
            <span className="text-xs font-medium text-slate-500">{totalCustomers.toLocaleString()} total users</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Donut Chart */}
            <div className="md:col-span-6 h-64 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ModernChartTooltip valueSuffix=" users" />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Centered KPI text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800">{totalCustomers.toLocaleString()}</span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Users</span>
              </div>
            </div>

            {/* Structured Segment Legend List (No text overlaps!) */}
            <div className="md:col-span-6 space-y-2 max-h-64 overflow-y-auto pr-1">
              {pieData.map((item, index) => {
                const pct = totalCustomers > 0 ? ((item.value / totalCustomers) * 100).toFixed(1) : '0';
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                      />
                      <span className="text-xs font-medium text-slate-700 truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold text-slate-800">{item.value.toLocaleString()}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold min-w-[42px] text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horizontal Bar Chart with Truncated & Spaced Y-Axis */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Top Revenue Contributing Segments</h3>
          <p className="text-xs text-slate-400 mb-4">Ranked by overall financial contribution</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={revenueData} 
                layout="vertical" 
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={155} 
                  tick={<TruncatedYAxisTick maxChars={20} />} 
                />
                <Tooltip content={<ModernChartTooltip isCurrency={true} />} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {revenueData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart with Proper Perimeter Margins */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Behavioral Profile Comparison</h3>
          <p className="text-xs text-slate-400 mb-2">Multi-dimensional scoring across key segments</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart 
                cx="50%" 
                cy="50%" 
                outerRadius="58%" 
                data={formattedRadarData}
                margin={{ top: 10, right: 20, bottom: 20, left: 20 }}
              >
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} 
                />
                {radarData.map((s, i) => (
                  <Radar 
                    key={s.name} 
                    name={s.name} 
                    dataKey={s.name} 
                    stroke={COLORS[i % COLORS.length]} 
                    fill={COLORS[i % COLORS.length]} 
                    fillOpacity={0.25} 
                  />
                ))}
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                />
                <Tooltip content={<ModernChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
