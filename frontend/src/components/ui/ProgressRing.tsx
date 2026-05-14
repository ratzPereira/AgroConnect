import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ProgressRingProps {
  readonly value: number;
  readonly max?: number;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly color?: string;
  readonly trackColor?: string;
  readonly children?: ReactNode;
  readonly className?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color = 'text-primary-500',
  trackColor = 'text-neutral-200',
  children,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const offset = circumference * (1 - percentage);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn('stroke-current', trackColor)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('stroke-current transition-[stroke-dashoffset] duration-700 ease-out', color)}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
