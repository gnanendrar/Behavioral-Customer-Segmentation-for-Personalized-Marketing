import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: string;
  trendUp?: boolean;
  icon?: ReactNode;
  color?: string;
  note?: string;
}

/** A single figure with its label. Icons are accepted for compatibility but kept quiet. */
export function StatCard({ title, value, change, trend, trendUp, icon, note }: StatCardProps) {
  const up = trend !== undefined ? trendUp !== false : change !== undefined ? change >= 0 : undefined;
  const delta = trend ?? (change !== undefined ? `${Math.abs(change)}%` : undefined);
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13.5px] text-gray-500">{title}</p>
        {icon && <span className="text-gray-300 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <p className="text-[28px] font-semibold leading-none text-gray-900 tnum" style={{ fontStretch: '108%', letterSpacing: '-0.02em' }}>
          {value}
        </p>
        {delta !== undefined && (
          <span className={`inline-flex items-center gap-1 text-[13px] font-medium ${up ? 'text-emerald-700' : 'text-red-700'}`}>
            {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {delta}
          </span>
        )}
      </div>
      {note && <p className="mt-2 text-[12.5px] text-gray-500">{note}</p>}
    </div>
  );
}

export default StatCard;
