import { useEffect, useId, useRef, type MouseEvent } from 'react';
import type { CalendarEvent } from '@/types/calendar';
import { MonthEventChip } from './MonthEventChip';

interface DayOverflowPopoverProps {
  readonly dayIso: string;
  readonly events: CalendarEvent[];
  readonly conflictSet: Set<number>;
  readonly onClose: () => void;
  readonly onEventClick?: (event: CalendarEvent, mouse: MouseEvent<HTMLButtonElement>) => void;
}

function formatDayHeading(dayIso: string): string {
  const [y, m, d] = dayIso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function DayOverflowPopover({
  dayIso,
  events,
  conflictSet,
  onClose,
  onEventClick,
}: DayOverflowPopoverProps) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const countLabel = events.length === 1 ? '1 trabalho' : `${events.length} trabalhos`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Fechar"
        data-testid="overflow-backdrop"
        className="absolute inset-0 h-full w-full cursor-default bg-black/30"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className="relative max-h-[80vh] w-80 overflow-y-auto rounded-xl bg-white p-4 shadow-2xl outline-none"
      >
        <header className="mb-3 flex items-baseline justify-between">
          <h3 id={headingId} className="text-sm font-semibold capitalize text-neutral-800">
            {formatDayHeading(dayIso)}
          </h3>
          <span className="text-xs text-neutral-500">{countLabel}</span>
        </header>
        <div className="space-y-1.5">
          {events.map((e) => (
            <MonthEventChip
              key={e.executionId}
              event={e}
              hasConflict={conflictSet.has(e.executionId)}
              onClick={onEventClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
