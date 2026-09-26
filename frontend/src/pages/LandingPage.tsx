import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Zap, Brain, Sliders, TrendingUp, 
  ArrowRight, Loader2, Play, Database
} from 'lucide-react';
import { generateSyntheticData, runAnalysis } from '../services/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDemoData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setLoadingText('Generating synthetic behavioral data...');
      await generateSyntheticData();
      
      setLoadingText('Running AI behavioral analysis pipeline...');
      await runAnalysis();
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Demo generation failed:', err);
      setError(err.message || 'Failed to generate demo data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: <Users className="h-6 w-6 text-indigo-600" />, title: 'Behavioral Segmentation', desc: 'Automatically cluster users based on deep behavioral patterns, not just demographics.' },
    { icon: <Database className="h-6 w-6 text-purple-600" />, title: 'Customer 360°', desc: 'Holistic view of every customer, enriched with over 40 synthesized behavioral features.' },
    { icon: <Zap className="h-6 w-6 text-emerald-600" />, title: 'Marketing Actions', desc: 'Generate precise, hyper-personalized marketing campaigns tailored to each segment.' },
    { icon: <Brain className="h-6 w-6 text-pink-600" />, title: 'AI Copilot', desc: 'Talk to your data. Ask natural language questions and get instant strategic insights.' },
    { icon: <Sliders className="h-6 w-6 text-amber-600" />, title: 'What-If Simulator', desc: 'Test marketing strategies and predict segment shifts before spending a dime.' },
    { icon: <TrendingUp className="h-6 w-6 text-cyan-600" />, title: 'Revenue Intelligence', desc: 'Identify churn risks and upsell opportunities before they impact your bottom line.' },
  ];

  const steps = [
    { title: 'Upload Data', desc: 'Connect your raw transaction and event data.' },
    { title: 'Discover Patterns', desc: 'Our ML engine creates rich behavioral features.' },
    { title: 'Understand Segments', desc: 'Explore AI-generated customer clusters.' },
    { title: 'Take Action', desc: 'Deploy targeted campaigns and boost ROI.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              Behavior<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">IQ</span>
            </h1>
            <p className="text-2xl md:text-3xl font-medium text-indigo-100 mb-6">
              Behavioral Customer Segmentation & Personalized Marketing Intelligence
            </p>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Transform your raw customer data into actionable revenue. BehaviorIQ uses advanced machine learning to discover hidden customer patterns, predict churn, and generate personalized marketing strategies.
            </p>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                Launch Dashboard <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={handleDemoData}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg font-semibold text-lg transition-all backdrop-blur-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {loadingText}</>
                ) : (
                  <><Play className="w-5 h-5" /> Try Demo Data</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Uncover the "Why" Behind the Buy</h2>
          <p className="text-lg text-slate-600">Demographics tell you who. BehaviorIQ tells you what they'll do next.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-slate-900 py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-slate-400">From raw data to revenue in minutes, not months.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 relative z-10 border-4 border-slate-900">
                  {idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-slate-700 -z-0"></div>
                )}
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200 text-center">
        <p className="text-slate-500 font-medium text-lg">BehaviorIQ &copy; {new Date().getFullYear()}</p>
        <p className="text-slate-400 text-sm mt-2">Intelligent Behavioral Analytics Platform</p>
      </footer>
    </div>
  );
};

export default LandingPage;
