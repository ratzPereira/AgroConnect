import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { cn } from '@/utils/cn';
import type { CalendarEvent } from '@/types/calendar';
import type { RequestStatus } from '@/types/request';
import { MonthEventChip } from './MonthEventChip';
import { DayOverflowPopover } from './DayOverflowPopover';

interface MonthDayCellProps {
  readonly dayIso: string;
  readonly events: CalendarEvent[];
  readonly conflictSet: Set<number>;
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly loadIntensity: number;
  readonly onCellClick: (dayIso: string) => void;
  readonly onEventClick?: (event: CalendarEvent, mouse: MouseEvent<HTMLButtonElement>) => void;
}

const MAX_VISIBLE = 3;
const MAX_LOAD_TINT_OPACITY = 0.08;
const UNKNOWN_STATUS_PRIORITY = 99;

const STATUS_PRIORITY: Partial<Record<RequestStatus, number>> = {
  DISPUTED: 0,
  AWAITING_CONFIRMATION: 1,
  IN_PROGRESS: 2,
  AWARDED: 3,
  COMPLETED: 4,
  RATED: 5,
  CANCELLED: 6,
};

function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? UNKNOWN_STATUS_PRIORITY;
    const pb = STATUS_PRIORITY[b.status] ?? UNKNOWN_STATUS_PRIORITY;
    if (pa !== pb) return pa - pb;
    return (a.scheduledStartTime ?? '').localeCompare(b.scheduledStartTime ?? '');
  });
}

function parseDay(dayIso: string): number {
  return Number(dayIso.slice(-2));
}

export function MonthDayCell({
  dayIso,
  events,
  conflictSet,
  isCurrentMonth,
  isToday,
  loadIntensity,
  onCellClick,
  onEventClick,
}: MonthDayCellProps) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const sorted = useMemo(() => sortEvents(events), [events]);
  const visible = sorted.slice(0, MAX_VISIBLE);
  const overflowCount = sorted.length - visible.length;
  const hasConflict = events.some((e) => conflictSet.has(e.executionId));

  const intensityOpacity = Math.min(
    MAX_LOAD_TINT_OPACITY,
    Math.max(0, loadIntensity * MAX_LOAD_TINT_OPACITY),
  );

  return (
    <div
      className={cn(
        'relative flex min-h-[120px] flex-col border-b border-r border-neutral-200 p-1.5 text-xs',
        !isCurrentMonth && 'bg-neutral-50/60 text-neutral-400',
        isToday && 'ring-2 ring-inset ring-primary-500',
      )}
      // Dynamic load tint: opacity computed per cell, so Tailwind class cannot express it.
      // Color must match --color-primary-500 (#2D8A2D = rgb(45, 138, 45)).
      style={
        loadIntensity > 0
          ? { backgroundColor: `rgba(45, 138, 45, ${intensityOpacity})` }
          : undefined
      }
    >
      <div className="mb-1 flex items-start justify-between">
        {hasConflict ? (
          <span
            data-testid="conflict-dot"
            className="h-2 w-2 rounded-full bg-danger-500"
            title="Existe conflito neste dia"
          />
        ) : (
          <span />
        )}
        <span className={cn('font-semibold', isToday && 'text-primary-700')}>
          {parseDay(dayIso)}
        </span>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Abrir dia ${dayIso}`}
        className="flex-1 cursor-pointer space-y-1 overflow-hidden rounded outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        data-testid="cell-body"
        onClick={(e) => {
          if (e.target === e.currentTarget) onCellClick(dayIso);
        }}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCellClick(dayIso);
          }
        }}
      >
        {visible.map((e) => (
          <MonthEventChip
            key={e.executionId}
            event={e}
            hasConflict={conflictSet.has(e.executionId)}
            onClick={onEventClick}
          />
        ))}
        {overflowCount > 0 && (
          <button
            type="button"
            className="w-full rounded px-1 text-left text-[10px] font-medium text-primary-600 hover:bg-primary-50"
            onClick={() => setOverflowOpen(true)}
          >
            +{overflowCount} mais
          </button>
        )}
      </div>

      {overflowOpen && (
        <DayOverflowPopover
          dayIso={dayIso}
          events={sorted}
          conflictSet={conflictSet}
          onClose={() => setOverflowOpen(false)}
          onEventClick={onEventClick}
        />
      )}
    </div>
  );
}
