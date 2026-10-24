import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Moon, Sun, Search, Loader2, Play } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { titleForPath } from '../../lib/navigation';
import { getAppStatus, getAlerts, runAnalysis } from '../../services/api';

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    setMobileNavOpen, setCommandOpen, notificationCount, setNotificationCount,
    pipelineStatus, setPipelineStatus, darkMode, toggleDarkMode,
  } = useAppStore();
  const [status, setStatus] = useState<{ has_data: boolean; has_analysis: boolean; total_customers: number; total_segments: number } | null>(null);

  // Real pipeline state and alert count, refreshed on navigation.
  useEffect(() => {
    let cancelled = false;
    getAppStatus()
      .then(async (s) => {
        if (cancelled) return;
        setStatus(s);
        setPipelineStatus(s.pipeline_status === 'running' ? 'running' : s.has_analysis ? 'completed' : 'idle');
        if (s.has_analysis) {
          const alerts = await getAlerts().catch(() => []);
          if (!cancelled) setNotificationCount(Array.isArray(alerts) ? alerts.length : 0);
        } else {
          setNotificationCount(0);
        }
      })
      .catch(() => { if (!cancelled) setStatus(null); });
    return () => { cancelled = true; };
  }, [location.pathname, setPipelineStatus, setNotificationCount]);

  const rerun = async () => {
    setPipelineStatus('running');
    try {
      await runAnalysis();
      setPipelineStatus('completed');
      navigate(0);
    } catch {
      setPipelineStatus('idle');
    }
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-gray-50/85 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="min-w-0 truncate text-[17px] font-semibold text-gray-900" style={{ fontStretch: '112%' }}>
        {titleForPath(location.pathname)}
      </h1>

      {status && (
        <span className="ml-1 hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[12.5px] text-gray-600 md:inline-flex tnum">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              pipelineStatus === 'running' ? 'bg-amber-500 animate-pulse' : status.has_analysis ? 'bg-emerald-500' : 'bg-gray-400'
            }`}
          />
          {pipelineStatus === 'running'
            ? 'Analysing…'
            : status.has_analysis
              ? `${status.total_customers.toLocaleString()} customers · ${status.total_segments} segments`
              : status.has_data ? 'Data loaded, not analysed' : 'No data yet'}
        </span>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="hidden h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white pl-3 pr-2 text-[13.5px] text-gray-500 shadow-sm hover:border-gray-300 hover:text-gray-700 sm:flex"
        >
          <Search className="h-4 w-4" strokeWidth={1.8} />
          <span className="pr-6">Go to page</span>
          <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 sm:hidden"
          aria-label="Go to page"
        >
          <Search className="h-5 w-5" strokeWidth={1.8} />
        </button>

        {status?.has_data && (
          <button
            type="button"
            onClick={rerun}
            disabled={pipelineStatus === 'running'}
            className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 md:flex"
          >
            {pipelineStatus === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {pipelineStatus === 'running' ? 'Running' : 'Re-run analysis'}
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('/dashboard#alerts')}
          className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label={notificationCount ? `${notificationCount} alerts` : 'No alerts'}
          title={notificationCount ? `${notificationCount} alerts` : 'No alerts'}
        >
          <Bell className="h-5 w-5" strokeWidth={1.8} />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white tnum">
              {notificationCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={toggleDarkMode}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          title={darkMode ? 'Light theme' : 'Dark theme'}
        >
          {darkMode ? <Sun className="h-5 w-5" strokeWidth={1.8} /> : <Moon className="h-5 w-5" strokeWidth={1.8} />}
        </button>
      </div>
    </header>
  );
}
