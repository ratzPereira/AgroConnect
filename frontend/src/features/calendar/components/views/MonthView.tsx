import type { MouseEvent, ReactNode } from 'react';
import type { CalendarEvent, CalendarLane, ConflictResponse } from '@/types/calendar';
import { MonthGrid } from '../month/MonthGrid';
import { GanttMobileAgenda } from '../GanttMobileAgenda';

interface MonthViewProps {
  readonly events: CalendarEvent[];
  readonly conflicts: ConflictResponse[];
  readonly year: number;
  readonly month: number;
  readonly lane: CalendarLane;
  readonly emptyState?: ReactNode;
  readonly onDayClick?: (dayIso: string) => void;
  readonly onEventClick?: (event: CalendarEvent, mouse: MouseEvent<HTMLButtonElement>) => void;
}

export function MonthView({
  events,
  conflicts,
  year,
  month,
  emptyState,
  onDayClick,
  onEventClick,
}: MonthViewProps) {
  if (events.length === 0 && emptyState) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500 shadow-sm">
        {emptyState}
      </div>
    );
  }
  return (
    <>
      <div className="hidden md:block">
        <MonthGrid
          year={year}
          month={month}
          events={events}
          conflicts={conflicts}
          onCellClick={(dayIso) => onDayClick?.(dayIso)}
          onEventClick={onEventClick}
        />
      </div>
      <div className="md:hidden">
        <GanttMobileAgenda events={events} year={year} month={month} />
      </div>
    </>
  );
}
