import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wand2, Copy, Check, Mail, Smartphone, Bell, Target, 
  Calendar, DollarSign, Activity 
} from 'lucide-react';
import { getSegments, generateCampaign } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';

export default function CampaignGenerator() {
  const [searchParams] = useSearchParams();
  const preselectedSegment = searchParams.get('segment');

  const [segments, setSegments] = useState<any[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(preselectedSegment || '');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const data = await getSegments();
        setSegments(data);
        if (!selectedSegmentId && data.length > 0) {
          setSelectedSegmentId(data[0].segment_id || data[0].id);
        }
      } catch (err) {
        console.error("Failed to load segments", err);
      }
    };
    fetchSegments();
  }, []);

  const handleGenerate = async () => {
    if (!selectedSegmentId) return;
    setLoading(true);
    try {
      const data = await generateCampaign(selectedSegmentId, instructions);
      setCampaign(data);
      setCopiedStates({});
    } catch (err) {
      console.error("Failed to generate campaign", err);
      alert("Error generating campaign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [key]: false })), 2000);
  };

  const selectedSegment = segments.find(s => (s.segment_id || s.id) === selectedSegmentId);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader 
        title="AI Campaign Generator" 
        description="Auto-generate hyper-personalized marketing copy and strategy for your segments." 
      />

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Segment</label>
            <select
              value={selectedSegmentId}
              onChange={(e) => setSelectedSegmentId(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border bg-white"
            >
              <option value="" disabled>Select a segment</option>
              {segments.map((s, i) => (
                <option key={i} value={s.segment_id || s.id}>{s.segment_name}</option>
              ))}
            </select>
            {selectedSegment && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600">
                <span className="font-semibold text-gray-800">Size:</span> {selectedSegment.size} customers<br/>
                <span className="font-semibold text-gray-800">Key traits:</span> {selectedSegment.description || 'N/A'}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Instructions <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g., Focus on our upcoming summer sale, mention the 20% discount code SUMMER20..."
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border h-24 resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading || !selectedSegmentId}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-6 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Wand2 className="w-5 h-5" />}
            {loading ? 'Generating Magic...' : 'Generate Campaign'}
          </button>
        </div>
      </div>

      {campaign && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{campaign.campaign_name || 'Generated Campaign'}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-1.5"><Target className="w-4 h-4" /> {campaign.objective}</div>
              <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {campaign.recommended_timing}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <h3 className="font-semibold text-indigo-900 mb-1">Strategy</h3>
                <p className="text-indigo-700 text-sm">{campaign.strategy}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <h3 className="font-semibold text-emerald-900 mb-1">Core Offer</h3>
                <p className="text-emerald-700 text-sm">{campaign.offer}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Asset */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-500" /> Email Copy
                </h3>
                <button 
                  onClick={() => copyToClipboard(`Subject: ${campaign.email?.subject}\n\n${campaign.email?.body}`, 'email')}
                  className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition"
                  title="Copy email"
                >
                  {copiedStates['email'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 border-b border-gray-200 text-sm">
                  <span className="text-gray-500 font-medium">Subject:</span> <span className="text-gray-900 font-bold">{campaign.email?.subject}</span>
                </div>
                <div className="p-4 text-sm text-gray-700 whitespace-pre-wrap bg-white h-64 overflow-y-auto font-sans">
                  {campaign.email?.body}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* SMS Asset */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-gray-500" /> SMS Copy
                  </h3>
                  <button 
                    onClick={() => copyToClipboard(campaign.sms?.copy, 'sms')}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition"
                  >
                    {copiedStates['sms'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative mx-auto w-64 h-32 border-[4px] border-gray-800 rounded-2xl p-4 bg-gray-50 overflow-hidden">
                  <div className="bg-blue-500 text-white p-2.5 rounded-2xl rounded-br-sm text-xs w-48 float-right shadow-sm relative z-10">
                    {campaign.sms?.copy}
                  </div>
                </div>
              </div>

              {/* Push Asset */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-gray-500" /> Push Notification
                  </h3>
                  <button 
                    onClick={() => copyToClipboard(`${campaign.push?.title}\n${campaign.push?.body}`, 'push')}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition"
                  >
                    {copiedStates['push'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-md w-full max-w-sm mx-auto flex gap-3">
                  <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">{campaign.push?.title}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{campaign.push?.body}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
