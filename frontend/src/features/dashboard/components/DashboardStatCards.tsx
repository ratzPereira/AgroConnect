import type { ReactNode } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/utils/cn';

interface StatConfig {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: number;
  icon?: ReactNode;
  iconBg?: string;
}

interface DashboardStatCardsProps {
  stats: StatConfig[];
  className?: string;
}

export function DashboardStatCards({ stats, className }: DashboardStatCardsProps) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          prefix={stat.prefix}
          suffix={stat.suffix}
          decimals={stat.decimals}
          trend={stat.trend}
          icon={stat.icon}
          iconBg={stat.iconBg}
        />
      ))}
    </div>
  );
}
