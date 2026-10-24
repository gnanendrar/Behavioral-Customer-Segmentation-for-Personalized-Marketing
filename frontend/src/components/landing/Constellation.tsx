import { useEffect, useRef } from 'react';
import { SEGMENT_COLORS } from '../../lib/palette';

/**
 * The landing-page signature: customers start as an undifferentiated scatter and settle
 * into behavioural segments. Runs once on load; with reduced motion it draws the end state.
 * The groups and labels illustrate the demo run's segments.
 */
const GROUPS = [
  { x: 0.30, y: 0.30, spread: 0.075, share: 0.22, label: 'High-value loyalists', note: '45% of revenue' },
  { x: 0.60, y: 0.17, spread: 0.05, share: 0.11, label: 'At-risk VIPs', note: '32% of revenue' },
  { x: 0.82, y: 0.52, spread: 0.075, share: 0.22, label: 'Promotion-driven', note: 'heavy discount use' },
  { x: 0.50, y: 0.55, spread: 0.06, share: 0.14 },
  { x: 0.22, y: 0.70, spread: 0.07, share: 0.12, label: 'Dormant', note: 'churn risk 88/100' },
  { x: 0.66, y: 0.80, spread: 0.05, share: 0.07 },
  { x: 0.40, y: 0.86, spread: 0.04, share: 0.05 },
  { x: 0.92, y: 0.20, spread: 0.03, share: 0.04 },
  { x: 0.10, y: 0.44, spread: 0.035, share: 0.03 },
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = { sx: number; sy: number; tx: number; ty: number; g: number; r: number; d: number };

export default function Constellation({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rand = mulberry32(42);
    const gauss = () => {
      const u = Math.max(rand(), 1e-9), v = rand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const N = 1500;
    const pts: Pt[] = [];
    GROUPS.forEach((g, gi) => {
      const n = Math.round(N * g.share);
      for (let i = 0; i < n; i++) {
        pts.push({
          sx: rand(), sy: rand(),
          tx: g.x + gauss() * g.spread, ty: g.y + gauss() * g.spread * 0.9,
          g: gi, r: 1.1 + rand() * 1.5, d: rand() * 0.35,
        });
      }
    });

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0, start = 0;
    const DURATION = 1900, DELAY = 250;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const neutral = getComputedStyle(document.documentElement).getPropertyValue('--g-400').trim() || '#97a39d';

    const mix = (a: string, b: string, t: number) => {
      const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
      const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
      const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
      const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
      return `rgb(${r},${g},${bl})`;
    };

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        const local = Math.min(1, Math.max(0, (progress - p.d) / (1 - p.d)));
        const e = ease(local);
        const x = (p.sx + (p.tx - p.sx) * e) * w;
        const y = (p.sy + (p.ty - p.sy) * e) * h;
        ctx.globalAlpha = 0.55 + 0.35 * e;
        ctx.fillStyle = mix(neutral.startsWith('#') ? neutral : '#97a39d', SEGMENT_COLORS[p.g], e);
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (labelsRef.current) labelsRef.current.style.opacity = String(Math.max(0, (progress - 0.85) / 0.15));
    };

    const frame = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, Math.max(0, (now - start - DELAY) / DURATION));
      draw(t);
      if (t < 1) raf = requestAnimationFrame(frame);
    };

    resize();
    if (reduce) draw(1); else raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => { resize(); draw(reduce || start === 0 ? (reduce ? 1 : 0) : 1); });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
      <div ref={labelsRef} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity" aria-hidden="true">
        {GROUPS.map((g, i) =>
          g.label ? (
            <div
              key={g.label}
              className="absolute -translate-x-1/2 whitespace-nowrap text-center"
              style={{ left: `${g.x * 100}%`, top: `calc(${(g.y + g.spread * 2.3) * 100}% + 4px)` }}
            >
              <span className="block text-[12.5px] font-semibold text-gray-900">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: SEGMENT_COLORS[i] }} />
                {g.label}
              </span>
              <span className="block text-[11.5px] text-gray-500 tnum">{g.note}</span>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
