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
}

export function StatCard({ 
  title, 
  value, 
  change, 
  trend,
  trendUp,
  icon, 
  color = 'text-indigo-600' 
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <div className={`rounded-md bg-gray-50 p-2 ${color}`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-baseline gap-4">
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        
        {trend !== undefined && (
          <div className={`flex items-center text-sm font-medium ${trendUp !== false ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp !== false ? (
              <TrendingUp className="mr-1 h-4 w-4" />
            ) : (
              <TrendingDown className="mr-1 h-4 w-4" />
            )}
            {trend}
          </div>
        )}

        {trend === undefined && change !== undefined && (
          <div className={`flex items-center text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? (
              <TrendingUp className="mr-1 h-4 w-4" />
            ) : (
              <TrendingDown className="mr-1 h-4 w-4" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
