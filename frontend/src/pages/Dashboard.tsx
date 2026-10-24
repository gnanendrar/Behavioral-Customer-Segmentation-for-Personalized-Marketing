import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Upload, Loader2 } from 'lucide-react';
import { getAppStatus, getSegments, getAlerts, getMarketingActions, generateSyntheticData, runAnalysis } from '../services/api';
import { segmentColor, formatMoney } from '../lib/palette';

interface Seg {
  segment_id: number;
  segment_name: string;
  customer_count: number;
  percentage: number;
  revenue_contribution: number;
  revenue?: number;
  avg_value_score: number;
  avg_engagement_score: number;
  avg_churn_risk: number;
  key_characteristics?: string[];
}
interface Alert { severity: string; title: string; message: string; recommended_action?: string; affected_count?: number }
interface Action { segment_id: number; strategy: string; channel: string[] | string; offer: string; frequency: string; priority?: string }

const pretty = (s?: string) => (s ? s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '');

function RiskBar({ value }: { value: number }) {
  const tone = value >= 65 ? 'bg-red-500' : value >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100" role="presentation">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(3, Math.min(100, value))}%` }} />
      </div>
      <span className="w-7 text-right text-[13.5px] text-gray-700 tnum">{Math.round(value)}</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [segments, setSegments] = useState<Seg[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [demoBusy, setDemoBusy] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const status = await getAppStatus();
        setHasAnalysis(status.has_analysis);
        if (status.has_analysis) {
          const [s, a, m] = await Promise.all([getSegments(), getAlerts().catch(() => []), getMarketingActions().catch(() => [])]);
          setSegments((Array.isArray(s) ? s : s?.segments) || []);
          setAlerts(Array.isArray(a) ? a : a?.alerts || []);
          setActions(Array.isArray(m) ? m : []);
        }
      } catch (e: any) {
        setError(e?.message?.includes('Network') ? 'The analysis server is not reachable. Start the backend on port 8000 and reload.' : e?.message || 'Could not load the dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Colour follows segment id so a segment keeps its colour on every page.
  const ordered = useMemo(() => [...segments].sort((a, b) => (b.revenue_contribution ?? 0) - (a.revenue_contribution ?? 0)), [segments]);
  const totals = useMemo(() => {
    const customers = segments.reduce((s, x) => s + (x.customer_count || 0), 0);
    const revenue = segments.reduce((s, x) => s + (x.revenue ?? 0), 0);
    const atRisk = segments.filter((x) => x.avg_churn_risk >= 65).reduce((s, x) => s + (x.revenue ?? 0), 0);
    const top2 = ordered.slice(0, 2);
    return {
      customers, revenue, atRisk,
      top2Customers: top2.reduce((s, x) => s + x.percentage, 0),
      top2Revenue: top2.reduce((s, x) => s + x.revenue_contribution, 0),
    };
  }, [segments, ordered]);
  const actionFor = (id: number) => actions.find((a) => a.segment_id === id);

  const loadDemo = async () => {
    setDemoBusy(true);
    try { await generateSyntheticData(); await runAnalysis(); navigate(0); }
    catch (e: any) { setError(e?.message || 'The demo could not be loaded.'); setDemoBusy(false); }
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-9 w-72 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-28 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
        <p className="font-semibold">The dashboard could not load</p>
        <p className="mt-1 text-[14px]">{error}</p>
      </div>
    );
  }

  if (!hasAnalysis) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h2 className="text-[30px] font-bold leading-tight" style={{ fontStretch: '118%', letterSpacing: '-0.025em' }}>
          No customers analysed yet
        </h2>
        <p className="mx-auto mt-3 max-w-[44ch] text-[15.5px] leading-relaxed text-gray-600">
          Upload a customer file, or load the demo of 1,500 customers to see how segments, scores and actions look.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={loadDemo} disabled={demoBusy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-[15px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-80">
            {demoBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            {demoBusy ? 'Finding segments…' : 'Load the demo data'}
          </button>
          <Link to="/upload" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 text-[15px] font-medium text-gray-800 hover:border-gray-400">
            <Upload className="h-4 w-4" /> Upload a file
          </Link>
        </div>
      </div>
    );
  }

  const highAlerts = alerts.filter((a) => ['critical', 'high'].includes(a.severity));

  return (
    <div className="space-y-10">
      {/* Headline: the finding, not the topic */}
      <section>
        <h2 className="max-w-[24ch] text-[30px] font-bold leading-[1.08] text-gray-900 sm:text-[38px]" style={{ fontStretch: '120%', letterSpacing: '-0.03em' }}>
          {ordered.length >= 2
            ? `Two segments bring in ${Math.round(totals.top2Revenue)}% of revenue from ${Math.round(totals.top2Customers)}% of customers.`
            : 'Your customer segments'}
        </h2>
        <dl className="mt-7 grid grid-cols-2 divide-gray-200 rounded-2xl border border-gray-200 bg-white sm:grid-cols-4 sm:divide-x">
          {[
            { k: 'Customers', v: totals.customers.toLocaleString() },
            { k: 'Revenue', v: formatMoney(totals.revenue) },
            { k: 'Average per customer', v: formatMoney(totals.customers ? totals.revenue / totals.customers : 0) },
            { k: 'Revenue in high-risk segments', v: formatMoney(totals.atRisk), tone: totals.atRisk > 0 ? 'text-red-700' : '' },
          ].map((m, i) => (
            <div key={m.k} className={`px-5 py-4 ${i >= 2 ? 'border-t border-gray-200 sm:border-t-0' : ''} ${i % 2 === 1 ? 'border-l border-gray-200 sm:border-l-0' : ''}`}>
              <dt className="text-[13.5px] text-gray-500">{m.k}</dt>
              <dd className={`mt-1.5 text-[26px] font-semibold leading-none tnum ${m.tone || 'text-gray-900'}`} style={{ fontStretch: '108%', letterSpacing: '-0.02em' }}>
                {m.v}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Share of customers vs share of revenue */}
      <section aria-labelledby="mix-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="mix-title" className="text-[18px] font-semibold" style={{ fontStretch: '110%' }}>Who brings in the revenue</h3>
          <p className="text-[13.5px] text-gray-500">Each segment's share of customers compared with its share of revenue</p>
        </div>
        <div className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-white p-5">
          {[
            { label: 'Customers', key: 'percentage' as const },
            { label: 'Revenue', key: 'revenue_contribution' as const },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-[80px_1fr] items-center gap-4">
              <span className="text-[13.5px] text-gray-600">{row.label}</span>
              <div className="flex h-9 w-full overflow-hidden rounded-lg">
                {ordered.map((s) => {
                  const w = s[row.key] ?? 0;
                  if (w <= 0) return null;
                  const dim = hovered !== null && hovered !== s.segment_id;
                  return (
                    <button
                      key={s.segment_id}
                      type="button"
                      onMouseEnter={() => setHovered(s.segment_id)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(s.segment_id)}
                      onBlur={() => setHovered(null)}
                      onClick={() => navigate('/segments')}
                      className="relative h-full border-r-2 border-white transition-opacity last:border-r-0"
                      style={{ width: `${w}%`, background: segmentColor(s.segment_id), opacity: dim ? 0.25 : 1 }}
                      title={`${s.segment_name}: ${w.toFixed(1)}% of ${row.label.toLowerCase()}`}
                      aria-label={`${s.segment_name}: ${w.toFixed(1)}% of ${row.label.toLowerCase()}`}
                    >
                      {w >= 9 && <span className={`absolute inset-0 items-center justify-center text-[12px] font-semibold text-white tnum ${w >= 16 ? 'flex' : 'hidden sm:flex'}`}>{Math.round(w)}%</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="pl-[96px] text-[13px] text-gray-500 max-sm:pl-0">
            {hovered !== null
              ? (() => { const s = segments.find((x) => x.segment_id === hovered)!; return `${s.segment_name}: ${s.percentage.toFixed(1)}% of customers, ${s.revenue_contribution.toFixed(1)}% of revenue.`; })()
              : 'Hover a block to compare one segment. Segments are ordered by revenue.'}
          </p>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Segment table */}
        <section aria-labelledby="seg-title" className="min-w-0">
          <div className="flex items-baseline justify-between">
            <h3 id="seg-title" className="text-[18px] font-semibold" style={{ fontStretch: '110%' }}>Segments and what to do next</h3>
            <Link to="/segments" className="text-[14px] font-medium text-indigo-700 hover:underline">Explore segments</Link>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-gray-200 text-[13px] text-gray-500">
                  <th scope="col" className="py-3 pl-5 pr-3 font-medium">Segment</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Customers</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Revenue</th>
                  <th scope="col" className="px-3 py-3 font-medium">Churn risk</th>
                  <th scope="col" className="py-3 pl-3 pr-5 font-medium">Recommended action</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((s) => {
                  const a = actionFor(s.segment_id);
                  const channels = a ? (Array.isArray(a.channel) ? a.channel.join(', ') : a.channel) : '';
                  return (
                    <tr
                      key={s.segment_id}
                      className={`border-b border-gray-100 last:border-0 ${hovered === s.segment_id ? 'bg-gray-50' : ''}`}
                      onMouseEnter={() => setHovered(s.segment_id)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: segmentColor(s.segment_id) }} />
                          <span className="font-medium text-gray-900">{s.segment_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700 tnum">{s.customer_count.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-gray-900 tnum">{formatMoney(s.revenue ?? 0)}</td>
                      <td className="px-3 py-3"><RiskBar value={s.avg_churn_risk} /></td>
                      <td className="py-3 pl-3 pr-5 text-gray-700">
                        {a ? (
                          <>
                            <span className="font-medium text-gray-900">{pretty(a.strategy)}</span>
                            <span className="text-gray-500">{` with ${pretty(a.offer).toLowerCase()}, ${a.frequency} by ${channels.replace(/_/g, ' ')}`}</span>
                          </>
                        ) : <span className="text-gray-400">No action generated</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Alerts */}
        <section id="alerts" aria-labelledby="alerts-title" className="scroll-mt-24">
          <div className="flex items-baseline justify-between">
            <h3 id="alerts-title" className="text-[18px] font-semibold" style={{ fontStretch: '110%' }}>Alerts</h3>
            <span className="text-[13.5px] text-gray-500 tnum">{highAlerts.length} need attention</span>
          </div>
          <ul className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
            {alerts.length === 0 && <li className="px-5 py-6 text-[14px] text-gray-500">No alerts. Behaviour looks stable across segments.</li>}
            {alerts.slice(0, 6).map((a, i) => {
              const sev = ['critical', 'high'].includes(a.severity) ? 'text-red-600' : a.severity === 'medium' ? 'text-amber-600' : 'text-gray-400';
              return (
                <li key={i} className="flex gap-3 px-5 py-4">
                  <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${sev}`} strokeWidth={2} aria-label={`${a.severity} severity`} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium leading-snug text-gray-900">{a.title}</p>
                    <p className="mt-1 text-[13.5px] leading-snug text-gray-600">{a.message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link to="/rescue" className="mt-3 inline-flex items-center gap-1 text-[14px] font-medium text-indigo-700 hover:underline">
            See customers to rescue <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
