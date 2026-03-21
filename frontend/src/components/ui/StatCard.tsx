import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from '@/utils/cn';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface SparklineDataPoint {
  value: number;
}

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: number;
  icon?: ReactNode;
  iconBg?: string;
  sparklineData?: SparklineDataPoint[];
  sparklineColor?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  prefix,
  suffix,
  decimals = 0,
  trend,
  icon,
  iconBg = 'bg-primary-50',
  sparklineData,
  sparklineColor = '#2D8A2D',
  className,
}: StatCardProps) {
  const animatedValue = useAnimatedCounter(value, { decimals });

  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white p-5', className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-neutral-500">{label}</p>
        {icon && (
          <div className={cn('flex items-center justify-center h-9 w-9 rounded-lg', iconBg)}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <p className="text-[32px] font-bold text-neutral-800 leading-none">
          {prefix}{animatedValue.toLocaleString('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
        </p>
        {trend !== undefined && trend !== 0 && (
          <span className={cn(
            'inline-flex items-center gap-0.5 text-xs font-medium mb-1',
            trend > 0 ? 'text-leaf-600' : 'text-danger-600',
          )}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`sparkline-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={sparklineColor}
                strokeWidth={1.5}
                fill={`url(#sparkline-${label})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
