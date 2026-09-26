import { useEffect, useState } from 'react';
import { Search, Beaker } from 'lucide-react';
import { getFeatureStore } from '../services/api';
import PageHeader from '../components/common/PageHeader';

const CATEGORY_COLORS: Record<string, string> = {
  'RFM': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Engagement': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Purchase': 'bg-amber-100 text-amber-800 border-amber-200',
  'Loyalty': 'bg-purple-100 text-purple-800 border-purple-200',
  'Churn Signals': 'bg-rose-100 text-rose-800 border-rose-200',
  'Composites': 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

const FeatureStore = () => {
  const [features, setFeatures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const data = await getFeatureStore();
        const list = Array.isArray(data) ? data : (data?.features || []);
        setFeatures(list);
      } catch (err: any) {
        setError(err.message || 'Failed to load feature store');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatures();
  }, []);

  const categories = ['All', ...Array.from(new Set(features.map(f => f.category)))].filter(Boolean);

  const filteredFeatures = features.filter(f => {
    const matchesCategory = activeCategory === 'All' || f.category === activeCategory;
    const matchesSearch = f.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || features.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        No features available. Run the analysis pipeline first.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Behavioral Feature Store" 
        subtitle="Explore the automatically engineered features used for ML segmentation"
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search features..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Feature Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold text-right">Mean</th>
                <th className="px-6 py-4 font-semibold text-right">Min/Max</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((feature, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                    <Beaker className="w-4 h-4 text-slate-400" />
                    {feature.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${CATEGORY_COLORS[feature.category] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                      {feature.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate" title={feature.description}>
                    {feature.description}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs">
                    {typeof feature.mean === 'number' ? feature.mean.toFixed(2) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">
                    [{typeof feature.min === 'number' ? feature.min.toFixed(1) : '-'}, {typeof feature.max === 'number' ? feature.max.toFixed(1) : '-'}]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFeatures.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No features match your search criteria.
            </div>
          )}
        </div>
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing {filteredFeatures.length} of {features.length} features</span>
        </div>
      </div>
    </div>
  );
};

export default FeatureStore;
