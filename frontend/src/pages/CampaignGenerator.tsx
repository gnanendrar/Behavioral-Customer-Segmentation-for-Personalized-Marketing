import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wand2, Copy, Check, Mail, Smartphone, Bell, Target, 
  Calendar 
} from 'lucide-react';
import { getSegments, generateCampaign } from '../services/api';
import PageHeader from '../components/common/PageHeader';

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
        const list = Array.isArray(data) ? data : (data?.segments || []);
        setSegments(list);
        if (!selectedSegmentId && list.length > 0) {
          setSelectedSegmentId(String(list[0].segment_id ?? list[0].id ?? ''));
        }
      } catch (err) {
        console.error("Failed to load segments", err);
      }
    };
    fetchSegments();
  }, [selectedSegmentId]);

  const handleGenerate = async () => {
    if (!selectedSegmentId) return;
    setLoading(true);
    try {
      const data = await generateCampaign(Number(selectedSegmentId), instructions);
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

  const selectedSegment = segments.find(s => String(s.segment_id ?? s.id) === String(selectedSegmentId));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader 
        title="AI Campaign Generator" 
        subtitle="Auto-generate hyper-personalized marketing copy and strategy for your segments." 
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
                <option key={i} value={s.segment_id ?? s.id}>{s.segment_name || `Segment ${s.segment_id ?? i}`}</option>
              ))}
            </select>
            {selectedSegment && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600">
                <span className="font-semibold text-gray-800">Size:</span> {selectedSegment.customer_count ?? selectedSegment.size ?? 0} customers<br/>
                <span className="font-semibold text-gray-800">Key traits:</span> {selectedSegment.key_characteristics?.join(', ') || selectedSegment.description || 'N/A'}
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" /> Email Copy
                </h3>
                <button 
                  onClick={() => copyToClipboard(`Subject: ${campaign.subject_line}\n\n${campaign.email_body}`, 'email')}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
                >
                  {copiedStates['email'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copiedStates['email'] ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex-1 flex flex-col gap-3">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Subject Line</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">{campaign.subject_line}</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Body</span>
                  <div className="text-sm text-gray-700 mt-1 whitespace-pre-line leading-relaxed">
                    {campaign.email_body}
                  </div>
                </div>
                {campaign.call_to_action && (
                  <div className="border-t border-gray-200 pt-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Call to Action</span>
                    <p className="text-sm font-semibold text-indigo-600 mt-1">{campaign.call_to_action}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Push & SMS */}
            <div className="space-y-6 flex flex-col">
              {/* SMS */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-600" /> SMS Message
                  </h3>
                  <button 
                    onClick={() => copyToClipboard(campaign.sms_copy, 'sms')}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
                  >
                    {copiedStates['sms'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copiedStates['sms'] ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700">
                  {campaign.sms_copy}
                </div>
              </div>

              {/* Push */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" /> Push Notification
                  </h3>
                  <button 
                    onClick={() => copyToClipboard(campaign.push_notification, 'push')}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
                  >
                    {copiedStates['push'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copiedStates['push'] ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700">
                  {campaign.push_notification}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
