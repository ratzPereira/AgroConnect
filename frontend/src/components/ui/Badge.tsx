import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  readonly variant?: BadgeVariant;
  readonly size?: BadgeSize;
  readonly dot?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary-50 text-primary-700 border-primary-200',
  success: 'bg-leaf-50 text-leaf-700 border-leaf-200',
  warning: 'bg-warning-50 text-warning-600 border-warning-100',
  danger: 'bg-danger-50 text-danger-700 border-danger-100',
  info: 'bg-secondary-50 text-secondary-700 border-secondary-200',
  neutral: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary-500',
  success: 'bg-leaf-500',
  warning: 'bg-warning-400',
  danger: 'bg-danger-600',
  info: 'bg-secondary-500',
  neutral: 'bg-neutral-400',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2 py-0.5 text-xs',
};

export function Badge({ variant = 'default', size = 'md', dot, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])} />
      )}
      {children}
    </span>
  );
}
