import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import type { CalendarEvent } from '@/types/calendar';

interface AllDayBandProps {
  readonly events: CalendarEvent[];
  readonly days?: number;
  readonly dayLabels?: string[];
  readonly emptyHint?: string;
  readonly rightActions?: ReactNode;
  readonly onEventClick?: (event: CalendarEvent) => void;
}

const URGENCY_CHIP: Record<string, string> = {
  HIGH: 'bg-warning-100 text-warning-800 border-warning-400',
  MEDIUM: 'bg-primary-100 text-primary-800 border-primary-400',
  LOW: 'bg-secondary-100 text-secondary-800 border-secondary-400',
};

export function AllDayBand({
  events,
  days = 1,
  dayLabels,
  emptyHint = 'Sem eventos de dia inteiro',
  rightActions,
  onEventClick,
}: AllDayBandProps) {
  const navigate = useNavigate();
  const allDayEvents = events.filter((e) => e.scheduledAllDay);

  function handleClick(event: CalendarEvent) {
    if (onEventClick) onEventClick(event);
    else navigate(`/provider/jobs/${event.requestId}`);
  }

  return (
    <div className="flex items-stretch border-b border-neutral-200 bg-neutral-50/60">
      <div className="flex w-44 flex-shrink-0 items-center justify-between border-r border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        <span>Dia inteiro</span>
        {rightActions}
      </div>
      <div
        className="grid flex-1"
        style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: days }).map((_, dayIdx) => {
          const dayEvents = filterEventsForDay(allDayEvents, dayIdx, days, dayLabels);
          return (
            <div
              key={`allday-${dayIdx}`}
              className={cn(
                'flex min-h-[40px] flex-col gap-1 px-2 py-1.5',
                dayIdx > 0 && 'border-l border-neutral-200',
              )}
            >
              {dayEvents.length === 0 ? (
                <span className="text-[10px] italic text-neutral-400">{emptyHint}</span>
              ) : (
                dayEvents.map((e) => (
                  <button
                    key={e.executionId}
                    type="button"
                    onClick={() => handleClick(e)}
                    className={cn(
                      'truncate rounded border px-2 py-1 text-left text-[11px] font-medium hover:brightness-95',
                      URGENCY_CHIP[e.urgency] ?? URGENCY_CHIP.MEDIUM,
                    )}
                    title={`${e.requestTitle} — ${e.categoryName}`}
                  >
                    {e.requestTitle}
                  </button>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function filterEventsForDay(
  events: CalendarEvent[],
  dayIdx: number,
  days: number,
  dayLabels?: string[],
): CalendarEvent[] {
  if (days === 1) return events;
  if (!dayLabels) return events;
  const dayIso = dayLabels[dayIdx];
  if (!dayIso) return events;
  return events.filter((e) => {
    const start = e.scheduledDate;
    const end = e.scheduledEndDate;
    return dayIso >= start && dayIso <= end;
  });
}
