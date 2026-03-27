import { useState, useMemo } from 'react';
import { AnimatedPage } from '@/components/AnimatedPage';
import { GanttChart } from '@/features/calendar/components/GanttChart';
import { useCalendarEvents, useCalendarConflicts } from '@/features/calendar/hooks/useCalendar';

export function ProviderCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // Build date range: first of month to last of month (ISO format)
  const { from, to } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      from: firstDay.toISOString().slice(0, 10),
      to: lastDay.toISOString().slice(0, 10),
    };
  }, [year, month]);

  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents(from, to);
  const { data: conflicts = [], isLoading: conflictsLoading } = useCalendarConflicts(from, to);

  function handleChangeMonth(newYear: number, newMonth: number) {
    setYear(newYear);
    setMonth(newMonth);
  }

  return (
    <AnimatedPage>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900">
          Calendário
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Organize e visualize todos os trabalhos agendados
        </p>
      </div>

      <GanttChart
        events={events}
        conflicts={conflicts}
        isLoading={eventsLoading || conflictsLoading}
        year={year}
        month={month}
        onChangeMonth={handleChangeMonth}
      />
    </AnimatedPage>
  );
}
