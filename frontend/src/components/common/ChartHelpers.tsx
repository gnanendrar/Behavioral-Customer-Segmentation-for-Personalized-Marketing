import React from 'react';

interface TruncatedTickProps {
  x?: number;
  y?: number;
  payload?: { value: string | number };
  maxChars?: number;
  angle?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  fontSize?: number;
  dy?: number;
  dx?: number;
}

export const TruncatedXAxisTick: React.FC<TruncatedTickProps> = ({
  x = 0,
  y = 0,
  payload,
  maxChars = 14,
  angle = -35,
  textAnchor = 'end',
  fontSize = 11,
  dy = 12,
  dx = -4,
}) => {
  const fullText = String(payload?.value ?? '');
  const displayText = fullText.length > maxChars ? `${fullText.slice(0, maxChars - 1)}…` : fullText;

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{fullText}</title>
      <text
        x={dx}
        y={dy}
        transform={`rotate(${angle})`}
        textAnchor={textAnchor}
        fill="#64748B"
        fontSize={fontSize}
        fontWeight={500}
      >
        {displayText}
      </text>
    </g>
  );
};

export const TruncatedYAxisTick: React.FC<TruncatedTickProps> = ({
  x = 0,
  y = 0,
  payload,
  maxChars = 16,
  fontSize = 11,
  dx = -8,
  dy = 4,
}) => {
  const fullText = String(payload?.value ?? '');
  const displayText = fullText.length > maxChars ? `${fullText.slice(0, maxChars - 1)}…` : fullText;

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{fullText}</title>
      <text
        x={dx}
        y={dy}
        textAnchor="end"
        fill="#475569"
        fontSize={fontSize}
        fontWeight={500}
      >
        {displayText}
      </text>
    </g>
  );
};

interface ModernTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  valuePrefix?: string;
  valueSuffix?: string;
  isCurrency?: boolean;
}

export const ModernChartTooltip: React.FC<ModernTooltipProps> = ({
  active,
  payload,
  label,
  valuePrefix = '',
  valueSuffix = '',
  isCurrency = false,
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700/60 text-xs z-50 pointer-events-none min-w-[140px]">
      {label && <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">{label}</p>}
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => {
          const color = entry.color || entry.fill || '#6366F1';
          const name = entry.name || entry.dataKey;
          const rawVal = entry.value;
          let formatted = typeof rawVal === 'number' ? rawVal.toLocaleString() : String(rawVal ?? '');
          if (isCurrency && typeof rawVal === 'number') {
            formatted = `$${rawVal.toLocaleString()}`;
          }

          return (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-slate-400 font-medium">{name}:</span>
              </div>
              <span className="font-bold text-white">
                {valuePrefix}{formatted}{valueSuffix}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
