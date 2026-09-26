import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Play, Database, Loader2 } from 'lucide-react';
import { uploadFile, generateSyntheticData, runAnalysis } from '../services/api';
import PageHeader from '../components/common/PageHeader';

const DataUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [datasetInfo, setDatasetInfo] = useState<any>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setUploadStatus('uploading');
      setStatusMessage('Uploading file...');
      
      try {
        const response = await uploadFile(selectedFile);
        setUploadStatus('success');
        setDatasetInfo(response);
        setStatusMessage('File uploaded successfully!');
      } catch (error: any) {
        setUploadStatus('error');
        setStatusMessage(error.message || 'Upload failed');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const handleDemoData = async () => {
    setUploadStatus('uploading');
    setStatusMessage('Generating synthetic dataset...');
    try {
      const response = await generateSyntheticData();
      setFile(new File([], 'demo_dataset.csv')); // Dummy file for UI state
      setUploadStatus('success');
      setDatasetInfo(response);
      setStatusMessage('Demo dataset generated successfully!');
    } catch (error: any) {
      setUploadStatus('error');
      setStatusMessage(error.message || 'Generation failed');
    }
  };

  const handleRunAnalysis = async () => {
    setAnalysisStatus('running');
    setStatusMessage('Running behavioral analysis pipeline. This may take a minute...');
    try {
      await runAnalysis();
      setAnalysisStatus('success');
      setStatusMessage('Analysis complete!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error: any) {
      setAnalysisStatus('error');
      setStatusMessage(error.message || 'Analysis failed');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader 
        title="Data Ingestion" 
        subtitle="Upload your customer event or transaction data to begin analysis"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
              ${uploadStatus === 'uploading' ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {isDragActive ? 'Drop your file here' : 'Drag & drop a CSV or Excel file'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">or click to browse from your computer</p>
            <div className="text-xs text-slate-400">Supported formats: .csv, .xlsx (Max 50MB)</div>
          </div>

          {(uploadStatus === 'success' || uploadStatus === 'error' || analysisStatus !== 'idle') && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border flex items-start gap-3
                ${uploadStatus === 'error' || analysisStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-800'}
              `}
            >
              {(uploadStatus === 'error' || analysisStatus === 'error') ? (
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (analysisStatus === 'running' || uploadStatus === 'uploading') ? (
                <Loader2 className="w-5 h-5 mt-0.5 animate-spin flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium">{statusMessage}</p>
                {analysisStatus === 'success' && <p className="text-sm mt-1">Redirecting to dashboard...</p>}
              </div>
            </motion.div>
          )}

          {uploadStatus === 'success' && datasetInfo && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" /> Dataset Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Rows</div>
                  <div className="text-xl font-bold text-slate-800">{datasetInfo.rows?.toLocaleString() || '-'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Columns</div>
                  <div className="text-xl font-bold text-slate-800">{datasetInfo.columns?.toLocaleString() || '-'}</div>
                </div>
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={analysisStatus === 'running' || analysisStatus === 'success'}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analysisStatus === 'running' ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> Analyzing Data...</>
                ) : (
                  <><Play className="w-6 h-6" /> Run Behavioral Analysis</>
                )}
              </button>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No data yet?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Generate a rich, synthetic retail dataset to explore the platform's capabilities instantly.
            </p>
            <button
              onClick={handleDemoData}
              disabled={uploadStatus === 'uploading' || analysisStatus === 'running'}
              className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Generate Demo Data
            </button>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Required Columns</h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Customer ID (string/int)</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Date/Timestamp (datetime)</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Event/Action Type (string)</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Value/Amount (numeric, optional)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;
