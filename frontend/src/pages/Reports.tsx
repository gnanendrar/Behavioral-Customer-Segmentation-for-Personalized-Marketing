import { Download, FileText, Database, Layers, CheckCircle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { useAppStore } from '../stores/appStore';
import { exportSegmentsCSV, exportCustomersCSV, exportReportPDF } from '../services/api';

const Reports = () => {
  const { customers = [], segments = [], lastUpdated } = useAppStore();

  const cards = [
    {
      title: 'Segment Definitions',
      description: 'Download the comprehensive list of behavioral segments, including their centroids, stats, and recommended actions.',
      icon: <Layers className="w-8 h-8 text-indigo-500" />,
      url: exportSegmentsCSV(),
      type: 'CSV',
      features: ['Segment Names & IDs', 'Centroid coordinates', 'Customer count & avg value', 'Strategic recommendations']
    },
    {
      title: 'Full Customer Dataset',
      description: 'Export the complete dataset containing all customers mapped to their assigned segments and calculated scores.',
      icon: <Database className="w-8 h-8 text-green-500" />,
      url: exportCustomersCSV(),
      type: 'CSV',
      features: ['Customer IDs', 'Raw behavioral metrics', 'Assigned Segment ID', 'Churn Risk & Value Score']
    },
    {
      title: 'Executive Summary',
      description: 'Generate a polished PDF report containing high-level insights, revenue projections, and key segment performance.',
      icon: <FileText className="w-8 h-8 text-red-500" />,
      url: exportReportPDF(),
      type: 'PDF',
      features: ['Visual charts & graphs', 'Revenue autopsy', 'Cohort analysis summary', 'Model evaluation summary']
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports & Export" 
        subtitle="Download data and insights for external use" 
      />

      <div className="bg-white rounded-lg shadow border border-gray-100 p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Current Analysis Snapshot</h3>
          <div className="mt-2 flex items-center space-x-6 text-sm text-gray-900">
            <div className="flex items-center"><Layers className="w-4 h-4 mr-2 text-indigo-500" /> <b>{segments?.length || 0}</b> &nbsp;Segments</div>
            <div className="flex items-center"><Database className="w-4 h-4 mr-2 text-green-500" /> <b>{(customers?.length || 0).toLocaleString()}</b> &nbsp;Customers</div>
            <div className="flex items-center text-gray-500">Last run: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-6 flex-grow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">{card.icon}</div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {card.type}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-500 mb-6">{card.description}</p>
              
              <div className="space-y-2 mb-6">
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Includes:</h4>
                <ul className="space-y-2">
                  {card.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 border-t border-gray-200 mt-auto">
              <a 
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download {card.type}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
