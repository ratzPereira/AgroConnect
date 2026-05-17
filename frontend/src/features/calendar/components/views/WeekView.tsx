import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CalendarEvent, CalendarLane, ConflictResponse } from '@/types/calendar';
import { WeekTimeGutter } from '../week/WeekTimeGutter';
import { DayColumn } from '../week/DayColumn';
import { AllDayBand } from '../primitives/AllDayBand';
import { buildConflictSet } from '../../utils/laneBuilders';
import { DAY_TOTAL_HEIGHT_PX } from '../../utils/weekLayout';
import { todayIso } from '../../utils/timeMath';

const TODAY_TICK_INTERVAL_MS = 60_000;

interface WeekViewProps {
  readonly events: CalendarEvent[];
  readonly conflicts: ConflictResponse[];
  readonly days: string[];
  readonly lane: CalendarLane;
  readonly onEventClick?: (event: CalendarEvent, mouse: { clientX: number; clientY: number }) => void;
  readonly emptyState?: ReactNode;
  readonly enableDnd?: boolean;
}

const DAY_NAMES_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function parseDayIso(dayIso: string): Date {
  const [y, m, d] = dayIso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function WeekView({
  events,
  conflicts,
  days,
  onEventClick,
  emptyState,
  enableDnd = false,
}: WeekViewProps) {
  const conflictSet = useMemo(() => buildConflictSet(conflicts), [conflicts]);
  const [today, setToday] = useState<string>(() => todayIso());
  useEffect(() => {
    const id = setInterval(() => {
      const next = todayIso();
      setToday((prev) => (prev === next ? prev : next));
    }, TODAY_TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
  const nonAllDayEvents = useMemo(() => events.filter((e) => !e.scheduledAllDay), [events]);

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex border-b border-neutral-200 bg-neutral-50">
        <div className="w-16 flex-shrink-0 border-r border-neutral-200" />
        <div
          className="grid flex-1"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {days.map((dayIso) => {
            const date = parseDayIso(dayIso);
            const dayName = DAY_NAMES_PT[date.getDay()];
            const isToday = dayIso === today;
            return (
              <div
                key={dayIso}
                className={`flex flex-col items-center justify-center px-2 py-2 ${
                  isToday ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                }`}
              >
                <span className="text-[10px] font-medium uppercase tracking-wide">{dayName}</span>
                <span className={`text-base font-bold ${isToday ? 'text-primary-700' : ''}`}>
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <AllDayBand
        events={events}
        days={days.length}
        dayLabels={days}
        onEventClick={
          onEventClick
            ? (e, mouse) => onEventClick(e, { clientX: mouse.clientX, clientY: mouse.clientY })
            : undefined
        }
      />

      <div className="flex overflow-x-auto">
        <WeekTimeGutter />
        <div
          className="grid flex-1"
          style={{
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
            height: DAY_TOTAL_HEIGHT_PX,
          }}
        >
          {days.map((dayIso) => (
            <DayColumn
              key={dayIso}
              dayIso={dayIso}
              events={nonAllDayEvents}
              conflictSet={conflictSet}
              isToday={dayIso === today}
              enableDnd={enableDnd}
              onEventClick={
                onEventClick
                  ? (event, e) => onEventClick(event, { clientX: e.clientX, clientY: e.clientY })
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {emptyState && events.length === 0 && (
        <div className="border-t border-neutral-200 px-6 py-6 text-center text-sm text-neutral-500">
          {emptyState}
        </div>
      )}
    </div>
  );
}
