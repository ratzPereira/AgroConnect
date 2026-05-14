import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  const baseClasses = 'bg-white rounded-xl border border-neutral-200 shadow-sm';

  if (onClick) {
    return (
      <button
        type="button"
        className={cn(baseClasses, 'cursor-pointer text-left w-full', className)}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  return <div className={cn(baseClasses, className)}>{children}</div>;
}

interface CardSectionProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-neutral-100', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: CardSectionProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-neutral-100', className)}>
      {children}
    </div>
  );
}
