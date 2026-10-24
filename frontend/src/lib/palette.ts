/**
 * Segment colours. Mid-saturation so they read on both the light paper and the dark
 * surface; the order keeps neighbouring segments distinct.
 */
export const SEGMENT_COLORS = [
  '#2E44D1', // ultramarine
  '#D99A1E', // saffron
  '#1E9E78', // jade
  '#CF4B78', // rose
  '#7A55DB', // iris
  '#2A93C2', // cerulean
  '#8E9A2A', // olive
  '#C25B37', // brick
  '#6D7B76', // slate
  '#B0569F', // orchid
];

export const segmentColor = (index: number) => SEGMENT_COLORS[((index % SEGMENT_COLORS.length) + SEGMENT_COLORS.length) % SEGMENT_COLORS.length];

/** Status colours used in charts (SVG attributes cannot read CSS variables reliably). */
export const STATUS = {
  good: '#1E9E78',
  warn: '#D99A1E',
  bad: '#D2483A',
  accent: '#2E44D1',
  muted: '#8A9892',
};

export const formatMoney = (v: number) => {
  if (!isFinite(v)) return '$0';
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}k`;
  return `$${Math.round(v).toLocaleString()}`;
};
