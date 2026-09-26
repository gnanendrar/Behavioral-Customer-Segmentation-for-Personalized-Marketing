import { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Activity, ChevronUp, ChevronDown, LifeBuoy 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getRescueQueue } from '../services/api';
import type { Customer } from '../types';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { Link } from 'react-router-dom';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#14B8A6', '#A855F7'];

const RescueQueue = () => {
  const [queue, setQueue] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Customer>('rescue_priority_score');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      try {
        const data = await getRescueQueue();
        const list = Array.isArray(data) ? data : (data?.queue || []);
        setQueue(list.slice(0, 50)); // top 50
      } catch (err) {
        console.error('Failed to load rescue queue', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedQueue = [...queue].sort((a, b) => {
    const aVal = (a as any)[sortField] ?? 0;
    const bVal = (b as any)[sortField] ?? 0;
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalAtRisk = queue.length;
  const totalRevenueAtRisk = queue.reduce((sum, c) => sum + (c.revenue_at_risk || 0), 0);
  const avgPriority = queue.length ? queue.reduce((sum, c) => sum + (c.rescue_priority_score ?? c.rescue_priority ?? 0), 0) / queue.length : 0;
  
  // segment distribution
  const segmentCounts: Record<string, number> = {};
  queue.forEach(c => {
    const segName = c.segment_name || 'Unassigned';
    segmentCounts[segName] = (segmentCounts[segName] || 0) + 1;
  });
  const segmentChartData = Object.keys(segmentCounts).map(name => ({
    name,
    count: segmentCounts[name]
  })).sort((a, b) => b.count - a.count);
  
  const mostUrgentSegment = segmentChartData.length > 0 ? segmentChartData[0].name : 'N/A';

  const getNormPriority = (c: Customer) => {
    const raw = c.rescue_priority_score ?? c.rescue_priority ?? 0;
    return raw > 1 ? raw / 100 : raw;
  };

  const getUrgencyColor = (priority: number) => {
    if (priority >= 0.7) return 'bg-red-50 hover:bg-red-100';
    if (priority >= 0.4) return 'bg-yellow-50 hover:bg-yellow-100';
    return 'bg-white hover:bg-gray-50';
  };
  
  const getPriorityBarColor = (priority: number) => {
    if (priority >= 0.7) return 'bg-red-500';
    if (priority >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Customer Rescue Queue" 
        subtitle="Priority-ranked customers worth saving" 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="At-Risk Customers" 
          value={totalAtRisk.toString()} 
          icon={<Users className="text-orange-500" />} 
        />
        <StatCard 
          title="Revenue at Risk" 
          value={`$${totalRevenueAtRisk.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
          icon={<DollarSign className="text-red-500" />} 
        />
        <StatCard 
          title="Avg Risk Priority" 
          value={avgPriority > 1 ? `${avgPriority.toFixed(1)}/100` : `${(avgPriority * 100).toFixed(1)}%`} 
          icon={<Activity className="text-purple-500" />} 
        />
        <StatCard 
          title="Highest Risk Segment" 
          value={mostUrgentSegment} 
          icon={<Users className="text-yellow-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Priority Intervention Queue</h3>
            <p className="text-sm text-gray-500">Customers sorted by likelihood of churn and monetary value</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th scope="col" className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                  <th scope="col" className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('segment_name')}>
                    Segment {sortField === 'segment_name' && (sortAsc ? <ChevronUp className="inline w-4 h-4"/> : <ChevronDown className="inline w-4 h-4"/>)}
                  </th>
                  <th scope="col" className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('rescue_priority_score')}>
                    Priority {sortField === 'rescue_priority_score' && (sortAsc ? <ChevronUp className="inline w-4 h-4"/> : <ChevronDown className="inline w-4 h-4"/>)}
                  </th>
                  <th scope="col" className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('revenue_at_risk')}>
                    Revenue Risk {sortField === 'revenue_at_risk' && (sortAsc ? <ChevronUp className="inline w-4 h-4"/> : <ChevronDown className="inline w-4 h-4"/>)}
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
                ) : sortedQueue.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">No at-risk customers found. Run the pipeline first.</td></tr>
                ) : (
                  sortedQueue.map((customer, idx) => {
                    const cid = String(customer.customer_id || customer.id || '');
                    const normPri = getNormPriority(customer);
                    const dispPri = customer.rescue_priority_score ?? customer.rescue_priority ?? 0;

                    return (
                      <tr key={cid || idx} className={getUrgencyColor(normPri)}>
                        <td className="px-3 py-4 whitespace-nowrap text-gray-900 font-medium">{idx + 1}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-indigo-600 font-medium hover:underline">
                          <Link to={`/customer/${cid}`}>{cid.substring(0, 10)}</Link>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-gray-700">{customer.segment_name}</td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-gray-700 mr-2">{dispPri.toFixed(1)}</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getPriorityBarColor(normPri)}`} 
                                style={{ width: `${Math.min(100, normPri * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-gray-700 font-medium">
                          ${(customer.revenue_at_risk || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-right">
                          <Link 
                            to={`/customer/${cid}`}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <LifeBuoy className="w-3 h-3 mr-1" /> Rescue
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Queue by Segment</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={segmentChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {segmentChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescueQueue;
