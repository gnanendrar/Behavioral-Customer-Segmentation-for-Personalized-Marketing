import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, DollarSign, Activity, AlertTriangle, Target, TrendingDown, 
  Award, MousePointerClick, ArrowRight 
} from 'lucide-react';
import { getAppStatus, getSegments, getAlerts } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import useAppStore from '../stores/appStore';
import { Segment, Alert } from '../types';

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
          setSegments(segmentsData.segments || []);
          setAlerts(alertsData.alerts || []);
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
            <BarChart2 className="w-10 h-10 text-indigo-600" />
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
  const totalCustomers = segments.reduce((sum, s) => sum + s.customer_count, 0);
  const totalRevenue = segments.reduce((sum, s) => sum + (s.metrics.monetary_value || 0) * s.customer_count, 0);
  const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  
  const pieData = segments.map(s => ({ name: s.segment_name, value: s.customer_count }));
  const revenueData = segments.map(s => ({ 
    name: s.segment_name, 
    revenue: (s.metrics.monetary_value || 0) * s.customer_count 
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const radarData = segments.slice(0, 3).map(s => ({
    name: s.segment_name,
    Value: s.metrics.monetary_value || 0,
    Engagement: s.metrics.engagement_score || 0,
    Loyalty: s.metrics.loyalty_index || 0,
    Activity: s.metrics.frequency || 0,
  }));
  // Transform for Recharts Radar
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-1">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Key Insights & Alerts
          </h3>
          <div className="space-y-4">
            {alerts.slice(0, 4).map((alert, idx) => (
              <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                alert.severity === 'high' ? 'border-red-500 bg-red-50' : 
                alert.severity === 'medium' ? 'border-amber-500 bg-amber-50' : 
                'border-blue-500 bg-blue-50'
              }`}>
                <p className="font-medium text-slate-900 text-sm mb-1">{alert.title}</p>
                <p className="text-sm text-slate-600">{alert.message}</p>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-slate-500 text-sm">No active alerts.</p>
            )}
          </div>
          <button 
            onClick={() => navigate('/actions')}
            className="mt-4 text-sm text-indigo-600 font-medium flex items-center gap-1 hover:text-indigo-800"
          >
            View all insights <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Charts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Segment Population Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Revenue Contributing Segments</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#6366F1" radius={[0, 4, 4, 0]}>
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Behavioral Profile Comparison</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={formattedRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{fontSize: 12}} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                {radarData.map((s, i) => (
                  <Radar 
                    key={s.name} 
                    name={s.name} 
                    dataKey={s.name} 
                    stroke={COLORS[i % COLORS.length]} 
                    fill={COLORS[i % COLORS.length]} 
                    fillOpacity={0.3} 
                  />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
