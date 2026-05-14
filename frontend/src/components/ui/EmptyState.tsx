import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  readonly illustration?: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({ illustration, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-16 px-4 animate-fade-in', className)}>
      {illustration && <div className="mb-6">{illustration}</div>}
      <h3 className="text-lg font-semibold text-neutral-800 mb-2">{title}</h3>
      {description && <p className="text-sm text-neutral-500 max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
