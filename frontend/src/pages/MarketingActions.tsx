import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Smartphone, Bell, Target, Clock, Zap, ArrowRight } from 'lucide-react';
import { getMarketingActions, getSegments, getMarketingFatigue, getGoldenHours } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';

export default function MarketingActions() {
  const navigate = useNavigate();
  const [actions, setActions] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [fatigue, setFatigue] = useState<any>(null);
  const [goldenHours, setGoldenHours] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [actionsData, segData, fatigueData, hoursData] = await Promise.all([
          getMarketingActions(),
          getSegments(),
          getMarketingFatigue(),
          getGoldenHours()
        ]);
        setActions(actionsData);
        setSegments(segData);
        setFatigue(fatigueData);
        setGoldenHours(hoursData);
      } catch (error) {
        console.error("Error fetching marketing data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <Smartphone className="w-4 h-4" />;
      case 'push': return <Bell className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-8">
      <PageHeader 
        title="Marketing Actions" 
        description="Recommended strategies and campaigns per segment based on behavioral data." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full"
          >
            <div className="p-5 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{action.segment_name}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded border border-indigo-100">
                    {action.strategy}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded border ${getPriorityColor(action.priority)}`}>
                    {action.priority} Priority
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Objective</div>
                <p className="text-sm text-gray-800">{action.objective}</p>
              </div>
              
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Channels</div>
                <div className="flex gap-2">
                  {(action.channels || []).map((ch: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {getChannelIcon(ch)} {ch}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Offer & Frequency</div>
                <div className="text-sm bg-gray-50 p-2 rounded text-gray-700 border border-gray-100">
                  <span className="font-medium">{action.offer}</span> — {action.frequency}
                </div>
              </div>

              <div className="mt-auto pt-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Rationale</div>
                <p className="text-sm text-gray-600 italic">"{action.rationale}"</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => navigate(`/campaign?segment=${action.segment_id}`)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Generate Campaign <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {fatigue && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-amber-500" />
              Marketing Fatigue Index
            </h3>
            <div className="space-y-4">
              {Object.entries(fatigue).map(([seg, data]: [string, any], idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-gray-700">{seg}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      data.risk === 'High' ? 'bg-red-100 text-red-800' : 
                      data.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {data.risk} Risk ({data.index}/100)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        data.risk === 'High' ? 'bg-red-500' : 
                        data.risk === 'Medium' ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${data.index}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {goldenHours && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-blue-500" />
              Golden Hours
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(goldenHours).map(([seg, data]: [string, any], idx) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-sm font-medium text-gray-700 mb-2">{seg}</div>
                  <div className="text-xl font-bold text-blue-900">{data.best_time}</div>
                  <div className="text-xs text-blue-700 mt-1">{data.best_day}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
