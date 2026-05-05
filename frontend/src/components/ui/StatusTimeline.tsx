import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

type StepStatus = 'completed' | 'active' | 'upcoming';

interface TimelineStep {
  label: string;
  description?: string;
  timestamp?: string;
  status: StepStatus;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function StatusTimeline({ steps, className }: StatusTimelineProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <div key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              {step.status === 'completed' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-leaf-500">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              ) : step.status === 'active' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary-500 bg-white">
                  <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-neutral-300 bg-white">
                  <div className="h-2 w-2 rounded-full bg-neutral-300" />
                </div>
              )}
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[24px]',
                    step.status === 'completed' ? 'bg-leaf-500' : 'bg-neutral-200',
                  )}
                />
              )}
            </div>
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <p className={cn(
                'text-sm font-medium',
                step.status === 'upcoming' ? 'text-neutral-400' : 'text-neutral-800',
              )}>
                {step.label}
              </p>
              {step.timestamp && (
                <p className="text-xs text-neutral-500 mt-0.5">{step.timestamp}</p>
              )}
              {step.description && (
                <p className="text-xs text-neutral-500 mt-0.5">{step.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
