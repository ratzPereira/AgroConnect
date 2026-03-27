import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import type { GanttBar as GanttBarType } from '@/types/calendar';

interface GanttBarProps {
  bar: GanttBarType;
  left: number;
  width: number;
  rowIndex: number;
  subIndex: number;
}

const URGENCY_STYLES: Record<string, { bar: string; text: string }> = {
  URGENT: {
    bar: 'bg-danger-500 hover:bg-danger-600',
    text: 'text-white',
  },
  HIGH: {
    bar: 'bg-warning-500 hover:bg-warning-600',
    text: 'text-white',
  },
  MEDIUM: {
    bar: 'bg-primary-500 hover:bg-primary-600',
    text: 'text-white',
  },
  LOW: {
    bar: 'bg-secondary-400 hover:bg-secondary-500',
    text: 'text-white',
  },
};

export function GanttBarComponent({ bar, left, width, subIndex }: GanttBarProps) {
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const style = URGENCY_STYLES[bar.urgency] ?? URGENCY_STYLES.MEDIUM;
  const barHeight = 34;
  const barGap = 4;
  const topOffset = 6 + subIndex * (barHeight + barGap);

  function handleClick() {
    navigate(`/requests/${bar.requestId}`);
  }

  return (
    <div
      ref={barRef}
      role="button"
      tabIndex={0}
      className={cn(
        'absolute rounded-md cursor-pointer transition-all duration-150 shadow-sm',
        'flex items-center px-2 overflow-hidden select-none',
        style.bar,
        bar.hasConflict && 'ring-2 ring-warning-400 ring-offset-1',
      )}
      style={{
        left: `${left}%`,
        width: `${Math.max(width, 1.5)}%`,
        top: `${topOffset}px`,
        height: `${barHeight}px`,
      }}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={cn('text-[11px] font-medium truncate leading-tight', style.text)}>
        {bar.requestTitle}
      </span>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-neutral-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg whitespace-nowrap max-w-[280px]">
            <p className="font-semibold truncate">{bar.requestTitle}</p>
            <p className="text-neutral-300 mt-0.5">{bar.categoryName}</p>
            <div className="flex gap-3 mt-1 text-neutral-400">
              <span>{bar.island}, {bar.parish}</span>
            </div>
            <div className="flex gap-3 mt-1 text-neutral-400">
              <span>{formatDate(bar.startDate)} — {formatDate(bar.endDate)}</span>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900" />
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
  });
}
