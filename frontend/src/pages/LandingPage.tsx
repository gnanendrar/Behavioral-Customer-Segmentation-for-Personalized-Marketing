import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Moon, Sun, Upload } from 'lucide-react';
import { generateSyntheticData, runAnalysis } from '../services/api';
import { useAppStore } from '../stores/appStore';
import { NAV_GROUPS } from '../lib/navigation';
import { LogoMark, Wordmark } from '../components/common/Logo';
import Constellation from '../components/landing/Constellation';

const STEPS = [
  { title: 'Load customers', body: 'Upload a CSV or Excel file, or use the 1,500-customer demo. Columns are matched and gaps filled automatically.' },
  { title: 'Describe behaviour', body: '31 features per customer: how recently and often they buy, what they spend, how they engage, and signs they are leaving.' },
  { title: 'Find the segments', body: 'K-Means, Ward, Gaussian mixture and DBSCAN each try 4 to 10 segments. The most separate, stable result wins.' },
  { title: 'Act on each one', body: 'Every segment gets a name, the traits that define it, and a strategy, channel, offer and contact frequency.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useAppStore();
  const [stage, setStage] = useState<'idle' | 'generating' | 'analysing'>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadDemo = async () => {
    setError(null);
    try {
      setStage('generating');
      await generateSyntheticData();
      setStage('analysing');
      await runAnalysis();
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err?.message?.includes('Network')
          ? 'The analysis server is not reachable. Start the backend on port 8000, then try again.'
          : err?.response?.data?.detail || err?.message || 'The demo could not be loaded.',
      );
      setStage('idle');
    }
  };

  const busy = stage !== 'idle';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark />
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1 text-[14px]">
          <a href="#how" className="hidden rounded-md px-3 py-2 text-gray-600 hover:text-gray-900 sm:block">How it works</a>
          <a href="#modules" className="hidden rounded-md px-3 py-2 text-gray-600 hover:text-gray-900 sm:block">What's inside</a>
          <Link to="/dashboard" className="rounded-md px-3 py-2 font-medium text-gray-900 hover:bg-gray-100">Open dashboard</Link>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
            aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative mx-auto grid max-w-[1280px] items-center gap-6 px-5 pb-16 pt-8 sm:px-8 lg:min-h-[640px] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:pb-24 lg:pt-12">
          <div className="relative z-10 max-w-[560px]">
            <h1 className="display text-[44px] text-gray-900 sm:text-[60px] lg:text-[68px]">
              See your customers by what they do.
            </h1>
            <p className="mt-6 max-w-[48ch] text-[17px] leading-[1.6] text-gray-600">
              BehaviorIQ turns raw customer records into behavioural segments, explains each one in plain words,
              and recommends what to send them.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={loadDemo}
                disabled={busy}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-[15px] font-semibold text-white shadow-md transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-80"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {stage === 'generating' ? 'Creating 1,500 customers…' : stage === 'analysing' ? 'Finding segments…' : 'Load the demo data'}
              </button>
              <Link
                to="/upload"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 text-[15px] font-medium text-gray-800 hover:border-gray-400"
              >
                <Upload className="h-4 w-4" strokeWidth={1.8} />
                Upload your own file
              </Link>
            </div>
            <p className="mt-4 text-[13.5px] text-gray-500" aria-live="polite">
              {error ? <span className="text-red-700">{error}</span> : 'The demo analyses 1,500 customers in about five seconds.'}
            </p>
          </div>

          <Constellation className="h-[380px] w-full sm:h-[460px] lg:h-[560px]" />
        </section>

        {/* How it works — a real sequence, so the steps are numbered */}
        <section id="how" className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8">
            <h2 className="max-w-[18ch] text-[34px] font-bold leading-[1.08] sm:text-[42px]" style={{ fontStretch: '120%', letterSpacing: '-0.03em' }}>
              From a spreadsheet to a plan per segment.
            </h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-[14px] font-semibold text-gray-900 tnum">
                      {i + 1}
                    </span>
                    {i < STEPS.length - 1 && <span className="hidden h-px flex-1 bg-gray-200 lg:block" />}
                  </div>
                  <h3 className="mt-5 text-[18px] font-semibold" style={{ fontStretch: '110%' }}>{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-gray-600">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Modules, grouped the way the work flows */}
        <section id="modules" className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <div>
              <h2 className="text-[34px] font-bold leading-[1.08] sm:text-[42px]" style={{ fontStretch: '120%', letterSpacing: '-0.03em' }}>
                Sixteen views, one workflow.
              </h2>
              <p className="mt-4 max-w-[40ch] text-[15.5px] leading-[1.6] text-gray-600">
                Each page answers one question about your customers. Press Ctrl K anywhere in the app to jump to any of them.
              </p>
            </div>
            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {NAV_GROUPS.filter((g) => g.label !== 'Overview').map((g) => (
                <div key={g.label}>
                  <h3 className="border-b border-gray-200 pb-2 text-[15px] font-semibold text-gray-900">{g.label}</h3>
                  <ul className="mt-1">
                    {g.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link to={item.href} className="group flex gap-3 rounded-lg py-2.5 pr-2">
                            <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gray-400 group-hover:text-indigo-600" strokeWidth={1.8} />
                            <span>
                              <span className="block text-[15px] font-medium text-gray-900 group-hover:text-indigo-700">{item.name}</span>
                              <span className="block text-[14px] text-gray-500">{item.hint}</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Evidence */}
        <section className="border-t border-gray-200 bg-white">
          <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-[30px] font-bold leading-[1.1] sm:text-[36px]" style={{ fontStretch: '118%', letterSpacing: '-0.025em' }}>
                Checked against customer types we already knew.
              </h2>
              <p className="mt-4 max-w-[52ch] text-[15.5px] leading-[1.65] text-gray-600">
                We generated customers from eight known behaviour types and measured how well the segments match them.
                Picking the number of segments by silhouette alone found two or three groups. Log-scaling skewed features
                and searching four to ten segments brought agreement up more than two and a half times.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200">
              {[
                { k: 'Agreement with true types, usual setup', v: '0.19' },
                { k: 'Agreement with true types, BehaviorIQ', v: '0.51' },
                { k: 'Segments found in the demo', v: '9' },
                { k: 'Time to analyse 10,000 customers', v: '12 s' },
              ].map((m) => (
                <div key={m.k} className="bg-white p-6">
                  <dd className="text-[34px] font-semibold leading-none tnum" style={{ fontStretch: '110%', letterSpacing: '-0.02em' }}>{m.v}</dd>
                  <dt className="mt-3 text-[13.5px] leading-snug text-gray-500">{m.k}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1280px] flex-col gap-2 px-5 py-10 text-[13.5px] text-gray-500 sm:flex-row sm:justify-between sm:px-8">
        <span>BehaviorIQ, behavioural customer segmentation for personalised marketing.</span>
        <span>Agreement measured as Adjusted Rand Index on synthetic data.</span>
      </footer>
    </div>
  );
}
