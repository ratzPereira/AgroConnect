import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import type { GanttBar as GanttBarType } from '@/types/calendar';

interface GanttBarProps {
  readonly bar: GanttBarType;
  readonly left: number;
  readonly width: number;
  readonly subIndex: number;
}

const URGENCY_STYLES: Record<string, { bar: string; text: string }> = {
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
  const barRef = useRef<HTMLButtonElement>(null);

  const style = URGENCY_STYLES[bar.urgency] ?? URGENCY_STYLES.MEDIUM;
  const barHeight = 34;
  const barGap = 4;
  const topOffset = 6 + subIndex * (barHeight + barGap);

  function handleClick() {
    navigate(`/requests/${bar.requestId}`);
  }

  return (
    <button
      type="button"
      ref={barRef}
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
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={cn('text-[11px] font-medium truncate leading-tight', style.text)}>
        {bar.requestTitle}
      </span>

      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <span className="block bg-neutral-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg whitespace-nowrap max-w-[280px]">
            <span className="block font-semibold truncate">{bar.requestTitle}</span>
            <span className="block text-neutral-300 mt-0.5">{bar.categoryName}</span>
            <span className="block mt-1 text-neutral-400">{bar.island}, {bar.parish}</span>
            <span className="block mt-1 text-neutral-400">{formatDate(bar.startDate)} — {formatDate(bar.endDate)}</span>
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900" />
          </span>
        </span>
      )}
    </button>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
  });
}
