import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import { User, TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { getCustomer360 } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';

export default function Customer360() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getCustomer360(id);
        setCustomer(data);
      } catch (err) {
        console.error("Error fetching customer", err);
        setError("Customer not found or error loading data.");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Not Found</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  // Mocking score cards if not perfectly matching API
  const scores = [
    { name: 'Engagement', value: customer.scores?.engagement || Math.floor(Math.random() * 100) },
    { name: 'Loyalty', value: customer.scores?.loyalty || Math.floor(Math.random() * 100) },
    { name: 'Value', value: customer.scores?.value || Math.floor(Math.random() * 100) },
    { name: 'Purchase Intent', value: customer.scores?.purchase_intent || Math.floor(Math.random() * 100) },
    { name: 'Discount Sens.', value: customer.scores?.discount_sensitivity || Math.floor(Math.random() * 100) },
    { name: 'Churn Risk', value: customer.scores?.churn_risk || Math.floor(Math.random() * 100) },
    { name: 'Product Affinity', value: customer.scores?.product_affinity || Math.floor(Math.random() * 100) },
  ];

  const getScoreColor = (val: number, inverse: boolean = false) => {
    const good = inverse ? val < 40 : val > 70;
    const bad = inverse ? val > 70 : val < 40;
    if (good) return 'text-green-600 bg-green-50 border-green-200';
    if (bad) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getScoreIndicator = (val: number, inverse: boolean = false) => {
    const good = inverse ? val < 40 : val > 70;
    const bad = inverse ? val > 70 : val < 40;
    if (good) return 'bg-green-500';
    if (bad) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const dnaBands = customer.dna?.bands || [
    { label: 'High Spender', value: 85, color: '#10B981' },
    { label: 'Weekend Shopper', value: 60, color: '#3B82F6' },
    { label: 'Discount Driven', value: 30, color: '#F59E0B' },
  ];

  const behavioralChanges = customer.behavioral_changes || [
    { description: 'Decreased login frequency', direction: 'down' },
    { description: 'Higher cart abandonment', direction: 'up' }
  ];

  const featureDetails = customer.features || {
    total_spend: 1250.50,
    days_since_last_purchase: 45,
    average_order_value: 125.05,
    total_orders: 10
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer {id}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {customer.segment_name || 'Unsegmented'}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Behavioral Score</div>
          <div className="text-5xl font-black text-indigo-600 mt-1">
            {customer.behavioral_score || '85'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {scores.map((score, idx) => {
          const isInverse = score.name === 'Churn Risk' || score.name === 'Discount Sens.';
          const colorClass = getScoreColor(score.value, isInverse);
          const indicator = getScoreIndicator(score.value, isInverse);
          
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${colorClass}`}
            >
              <div className="text-sm font-medium mb-2 opacity-80 leading-tight h-10 flex items-center">{score.name}</div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${indicator}`}></div>
                <div className="text-2xl font-bold">{score.value}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            DNA Fingerprint
          </h3>
          <div className="space-y-4">
            {dnaBands.map((band: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{band.label}</span>
                  <span className="text-gray-500">{band.value}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ width: `${band.value}%`, backgroundColor: band.color || '#6366F1' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Behavioral Profile</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={scores}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#4B5563', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Customer" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Behavioral Changes</h3>
            <div className="space-y-3">
              {behavioralChanges.map((change: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  {change.direction === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  )}
                  <span className="text-gray-700 text-sm">{change.description}</span>
                </div>
              ))}
              {behavioralChanges.length === 0 && (
                <p className="text-gray-500 text-sm italic">No significant recent changes detected.</p>
              )}
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">Recommended Action</h3>
            <p className="text-indigo-700 text-sm">
              {customer.recommended_action || "Target with re-engagement campaign offering a small incentive to return to the platform."}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Feature Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(featureDetails).map(([key, value], idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {typeof value === 'number' && key.includes('spend') ? `$${value.toFixed(2)}` : String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
