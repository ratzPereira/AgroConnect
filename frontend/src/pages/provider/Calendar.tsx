import { useMemo, useState } from 'react';
import { AnimatedPage } from '@/components/AnimatedPage';
import type { CalendarEvent } from '@/types/calendar';
import {
  useCalendarAlerts,
  useCalendarConflicts,
  useCalendarEvents,
  useCalendarSummary,
  useCalendarWorkload,
} from '@/features/calendar/hooks/useCalendar';
import { useCalendarFilters, applyFilters } from '@/features/calendar/hooks/useCalendarFilters';
import { rangeForView } from '@/features/calendar/utils/viewRange';
import { KpiStrip } from '@/features/calendar/components/header/KpiStrip';
import { DateNav } from '@/features/calendar/components/header/DateNav';
import { ViewSwitcher } from '@/features/calendar/components/header/ViewSwitcher';
import { LaneSwitcher } from '@/features/calendar/components/header/LaneSwitcher';
import { FilterPopover } from '@/features/calendar/components/header/FilterPopover';
import { SideRail } from '@/features/calendar/components/sidebar/SideRail';
import { WorkloadHeatmap } from '@/features/calendar/components/workload/WorkloadHeatmap';
import { DayView } from '@/features/calendar/components/views/DayView';
import { WeekView } from '@/features/calendar/components/views/WeekView';
import { MonthView } from '@/features/calendar/components/views/MonthView';
import { CalendarDnd } from '@/features/calendar/components/dnd/CalendarDnd';
import { EventPopover } from '@/features/calendar/components/popover/EventPopover';

export function ProviderCalendar() {
  const {
    filters,
    updateFilters,
    clearFilters,
    view,
    lane,
    anchor,
    setView,
    setLane,
    setAnchor,
  } = useCalendarFilters();

  const range = useMemo(() => rangeForView(view, anchor), [view, anchor]);
  const { from, to, days } = range;

  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents(from, to);
  const { data: conflicts = [] } = useCalendarConflicts(from, to);
  const { data: summary, isLoading: summaryLoading } = useCalendarSummary(from, to);
  const { data: workload, isLoading: workloadLoading } = useCalendarWorkload(from, to);
  const { data: alerts, isLoading: alertsLoading } = useCalendarAlerts(from, to);

  const filteredEvents = useMemo(() => applyFilters(events, filters), [events, filters]);

  const [popover, setPopover] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null);

  function handleEventClick(e: CalendarEvent, mouse: { clientX: number; clientY: number }) {
    setPopover({ event: e, x: mouse.clientX, y: mouse.clientY });
  }

  const hasActiveFilters =
    filters.operatorIds.length > 0 ||
    filters.machineIds.length > 0 ||
    filters.categories.length > 0 ||
    filters.urgencies.length > 0 ||
    filters.statuses.length > 0 ||
    filters.islands.length > 0 ||
    !filters.includeAllDay;

  return (
    <AnimatedPage>
      <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900">
            Calendário
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Plano operacional dos seus trabalhos, equipa e máquinas.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterPopover events={events} filters={filters} onChange={updateFilters} onClear={clearFilters} />
          <LaneSwitcher value={lane} onChange={setLane} />
          <ViewSwitcher value={view} onChange={setView} />
        </div>
      </div>

      <KpiStrip summary={summary} isLoading={summaryLoading} />

      <div className="my-4 flex items-center justify-between gap-2">
        <DateNav view={view} anchor={anchor} onChange={setAnchor} />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="space-y-4">
        <CalendarDnd events={filteredEvents}>
          {eventsLoading && (
            <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
              A carregar agenda…
            </div>
          )}
          {!eventsLoading && view === 'day' && (
            <DayView
              events={filteredEvents}
              conflicts={conflicts}
              dayIso={anchor}
              lane={lane}
              enableDnd
              onEventClick={(e, mouse) =>
                handleEventClick(e, { clientX: mouse.clientX, clientY: mouse.clientY })
              }
            />
          )}
          {!eventsLoading && view === 'week' && (
            <WeekView
              events={filteredEvents}
              conflicts={conflicts}
              days={days}
              lane={lane}
              enableDnd
              onEventClick={(e, mouse) => handleEventClick(e, mouse)}
            />
          )}
          {!eventsLoading && view === 'month' && (
            <MonthView
              events={filteredEvents}
              conflicts={conflicts}
              year={Number(anchor.slice(0, 4))}
              month={Number(anchor.slice(5, 7)) - 1}
              lane={lane}
              onDayClick={(dayIso) => {
                setView('day');
                setAnchor(dayIso);
              }}
              onEventClick={(e, mouse) =>
                handleEventClick(e, { clientX: mouse.clientX, clientY: mouse.clientY })
              }
            />
          )}
        </CalendarDnd>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <WorkloadHeatmap
              data={workload}
              isLoading={workloadLoading}
              onCellClick={(dateIso) => {
                setView('day');
                setAnchor(dateIso);
              }}
            />
          </div>
          <aside className="min-w-0">
            <SideRail
              alerts={alerts}
              events={filteredEvents}
              isLoading={alertsLoading}
              anchorIso={anchor}
            />
          </aside>
        </div>
      </div>

      {popover && (
        <EventPopover
          event={popover.event}
          anchor={{ x: popover.x, y: popover.y }}
          onClose={() => setPopover(null)}
        />
      )}
    </AnimatedPage>
  );
}
