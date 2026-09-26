import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle, Database, FileText, ShieldAlert } from 'lucide-react';
import { getDataQuality } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981'];

const DataQuality = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityData, setQualityData] = useState<any>(null);

  useEffect(() => {
    const fetchQuality = async () => {
      try {
        const data = await getDataQuality();
        setQualityData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load data quality report');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuality();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !qualityData) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-6 rounded-xl flex flex-col items-center text-center">
          <ShieldAlert className="w-12 h-12 mb-3 text-amber-500" />
          <p className="font-semibold text-lg">No Data Available</p>
          <p className="text-sm mt-1">Please upload a dataset or generate demo data to view the data quality report.</p>
        </div>
      </div>
    );
  }

  const score = qualityData.completeness_score ?? 95;
  const scoreColor = score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-amber-500' : 'text-red-500';

  const numericCount = qualityData.types?.numeric ?? (qualityData.numerical_columns?.length || 0);
  const catCount = qualityData.types?.categorical ?? (qualityData.categorical_columns?.length || 0);
  const dateCount = qualityData.types?.datetime ?? (qualityData.date_columns?.length || 0);

  const typeData = [
    { name: 'Numeric', count: numericCount },
    { name: 'Categorical', count: catCount },
    { name: 'Date/Time', count: dateCount }
  ];

  // Build missing details list
  const missingEntries: { col: string; count: number; percentage: number }[] = [];
  if (qualityData.missing_details) {
    Object.entries(qualityData.missing_details).forEach(([col, d]: [string, any]) => {
      missingEntries.push({ col, count: d.count ?? 0, percentage: d.percentage ?? 0 });
    });
  } else if (qualityData.missing_values_per_column || qualityData.missing_percentage) {
    const counts = qualityData.missing_values_per_column || qualityData.missing_values || {};
    const pcts = qualityData.missing_percentage || {};
    Object.keys(counts).forEach((col) => {
      missingEntries.push({
        col,
        count: counts[col] ?? 0,
        percentage: pcts[col] ?? 0,
      });
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Data Quality Assessment" 
        subtitle="Health checks, completeness, and distributions of your dataset"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Completeness Score" 
          value={`${score}%`} 
          color={scoreColor}
          icon={<ShieldAlert className={scoreColor} />} 
        />
        <StatCard 
          title="Total Rows" 
          value={(qualityData.total_rows || 0).toLocaleString()} 
          icon={<Database />} 
        />
        <StatCard 
          title="Total Columns" 
          value={qualityData.total_columns || 0} 
          icon={<FileText />} 
        />
        <StatCard 
          title="Duplicate Rows" 
          value={qualityData.duplicate_rows ?? 0} 
          icon={<CheckCircle className={qualityData.duplicate_rows ? 'text-amber-500' : 'text-emerald-500'} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Column Types</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {typeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Missing Values Details</h3>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">Column Name</th>
                  <th className="px-4 py-3 text-right">Missing Count</th>
                  <th className="px-4 py-3">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {missingEntries.length > 0 ? (
                  missingEntries.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.col}</td>
                      <td className="px-4 py-3 text-right">{item.count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${item.percentage > 20 ? 'bg-red-500' : item.percentage > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${Math.min(item.percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="w-10 text-right">{Number(item.percentage).toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" /> No missing values found!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataQuality;
