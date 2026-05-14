import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CalendarRange, ChevronRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { useCalendarEvents } from '../hooks/useCalendar';

const URGENCY_BADGE: Record<string, { variant: 'danger' | 'warning' | 'default' | 'info'; label: string }> = {
  HIGH: { variant: 'warning', label: 'Alta' },
  MEDIUM: { variant: 'default', label: 'Média' },
  LOW: { variant: 'info', label: 'Baixa' },
};

function getDateLabel(isToday: boolean, isTomorrow: boolean, startDate: Date): string {
  if (isToday) return 'Hoje';
  if (isTomorrow) return 'Amanhã';
  return startDate.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}

export function UpcomingJobsMini() {
  const navigate = useNavigate();

  const { from, to } = useMemo(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 14);
    return {
      from: today.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    };
  }, []);

  const { data: events = [], isLoading } = useCalendarEvents(from, to);

  // Sort by scheduled date and take next 5
  const upcoming = useMemo(() =>
    [...events]
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
      .slice(0, 5),
    [events],
  );

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-primary-500" />
          Próximos Trabalhos
        </h3>
        <Link
          to="/provider/calendar"
          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5"
        >
          Ver calendário <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {['uj-0', 'uj-1', 'uj-2'].map(k => (
            <div key={k} className="h-14 rounded-lg bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && upcoming.length === 0 && (
        <p className="text-sm text-neutral-400 text-center py-6">
          Sem trabalhos nas próximas 2 semanas
        </p>
      )}

      {!isLoading && upcoming.length > 0 && (
        <div className="space-y-2">
          {upcoming.map((event) => {
            const urgency = URGENCY_BADGE[event.urgency] ?? URGENCY_BADGE.MEDIUM;
            const startDate = new Date(event.scheduledDate + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.round((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isToday = diffDays === 0;
            const isTomorrow = diffDays === 1;

            return (
              <button
                key={event.executionId}
                onClick={() => navigate(`/requests/${event.requestId}`)}
                className={cn(
                  'w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-150 hover:shadow-sm',
                  isToday
                    ? 'border-primary-200 bg-primary-50/50 hover:border-primary-300'
                    : 'border-neutral-150 bg-white hover:border-neutral-300',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {event.requestTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-neutral-400 flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {event.parish}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={urgency.variant} size="sm">{urgency.label}</Badge>
                    <span className={cn(
                      'text-[11px] font-medium',
                      isToday && 'text-primary-600',
                      !isToday && isTomorrow && 'text-warning-600',
                      !isToday && !isTomorrow && 'text-neutral-500',
                    )}>
                      {getDateLabel(isToday, isTomorrow, startDate)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
