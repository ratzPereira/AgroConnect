import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  const baseClasses = 'bg-white rounded-xl border border-neutral-200 shadow-sm';

  if (onClick) {
    return (
      <div
        className={cn(baseClasses, 'cursor-pointer', className)}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>
    );
  }

  return <div className={cn(baseClasses, className)}>{children}</div>;
}

interface CardSectionProps {
  children: ReactNode;
  className?: string;
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
