import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar as CalendarIcon, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import type { CalendarEvent } from '@/types/calendar';
import { getEventVisualStyle } from '../utils/eventStyles';
import { todayIso } from '../utils/timeMath';

interface GanttMobileAgendaProps {
  readonly events: CalendarEvent[];
  readonly year: number;
  readonly month: number;
}

function groupByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const groups: Record<string, CalendarEvent[]> = {};

  for (const event of events) {
    const start = new Date(event.scheduledDate + 'T00:00:00');
    const end = new Date(event.scheduledEndDate + 'T00:00:00');
    const current = new Date(start);

    while (current <= end) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
      current.setDate(current.getDate() + 1);
    }
  }

  return groups;
}

export function GanttMobileAgenda({ events, year, month }: GanttMobileAgendaProps) {
  const navigate = useNavigate();
  const grouped = groupByDate(events);
  const today = todayIso();

  const daysInMonth: string[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    daysInMonth.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    );
    date.setDate(date.getDate() + 1);
  }

  const activeDays = daysInMonth.filter((d) => grouped[d]?.length);

  if (activeDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
        <CalendarIcon className="h-10 w-10 mb-3 text-neutral-300" />
        <p className="text-sm">Sem trabalhos agendados neste mês</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeDays.map((dateStr) => {
        const dayDate = new Date(dateStr + 'T00:00:00');
        const dayEvents = grouped[dateStr];
        const isToday = dateStr === today;

        return (
          <div key={dateStr}>
            <div
              className={cn(
                'flex items-center gap-2 mb-2 px-1',
                isToday && 'text-primary-600',
              )}
            >
              <span
                className={cn(
                  'text-sm font-bold',
                  isToday
                    ? 'bg-primary-500 text-white rounded-full w-7 h-7 flex items-center justify-center'
                    : 'text-neutral-700',
                )}
              >
                {dayDate.getDate()}
              </span>
              <span className="text-xs font-medium text-neutral-500 uppercase">
                {dayDate.toLocaleDateString('pt-PT', { weekday: 'short' })}
              </span>
              {isToday && (
                <Badge variant="default" size="sm">
                  Hoje
                </Badge>
              )}
            </div>

            <div className="space-y-2 ml-1">
              {dayEvents.map((event) => {
                const visual = getEventVisualStyle(event, false);
                return (
                  <button
                    key={`${dateStr}-${event.executionId}`}
                    type="button"
                    onClick={() => navigate(`/provider/requests/${event.requestId}`)}
                    className="group w-full text-left rounded-xl border border-neutral-200 bg-white p-3 hover:border-primary-300 hover:shadow-sm transition-all duration-150"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={cn(
                          'mt-0.5 inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-semibold uppercase tracking-wide',
                          visual.chipClass,
                        )}
                        aria-hidden
                      >
                        <span className="text-[11px]">{visual.statusIcon}</span>
                      </span>
                      <p className="flex-1 text-sm font-semibold text-neutral-800 leading-tight">
                        {event.requestTitle}
                      </p>
                      {(visual.urgencyBadge || visual.conflictBadge) && (
                        <span className="flex flex-shrink-0 items-center gap-1">
                          {visual.conflictBadge}
                          {visual.urgencyBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{event.categoryName}</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.parish}, {event.island}
                      </span>
                      {event.assignments.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.assignments.map((a) => a.teamMemberName).join(', ')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
