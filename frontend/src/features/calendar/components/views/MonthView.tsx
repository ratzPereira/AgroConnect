import { useMemo } from 'react';
import { GanttSidebar } from '../GanttSidebar';
import { GanttTimeline } from '../GanttTimeline';
import { GanttMobileAgenda } from '../GanttMobileAgenda';
import type {
  CalendarEvent,
  CalendarLane,
  ConflictResponse,
  GanttBar,
  GanttRow,
} from '@/types/calendar';
import { buildConflictSet } from '../../utils/laneBuilders';

interface MonthViewProps {
  events: CalendarEvent[];
  conflicts: ConflictResponse[];
  year: number;
  month: number;
  lane: CalendarLane;
  emptyState?: React.ReactNode;
}

function toGanttBar(event: CalendarEvent, conflictSet: Set<number>): GanttBar {
  return {
    executionId: event.executionId,
    requestId: event.requestId,
    requestTitle: event.requestTitle,
    categoryName: event.categoryName,
    startDate: event.scheduledDate,
    endDate: event.scheduledEndDate,
    urgency: event.urgency,
    status: event.status,
    island: event.island,
    parish: event.parish,
    hasConflict: conflictSet.has(event.executionId),
  };
}

function buildRows(
  events: CalendarEvent[],
  lane: CalendarLane,
  conflictSet: Set<number>,
): GanttRow[] {
  if (lane === 'jobs') {
    return events.map((event) => ({
      id: `job-${event.executionId}`,
      label: event.requestTitle,
      sublabel: event.categoryName,
      bars: [toGanttBar(event, conflictSet)],
    }));
  }

  const map = new Map<number, { name: string; bars: GanttBar[] }>();
  for (const event of events) {
    for (const a of event.assignments) {
      if (lane === 'machines' && a.machineId == null) continue;
      const key = lane === 'machines' ? a.machineId : a.teamMemberId;
      const name = lane === 'machines' ? a.machineName ?? `Máquina #${a.machineId}` : a.teamMemberName;
      if (key == null) continue;
      let entry = map.get(key);
      if (!entry) {
        entry = { name, bars: [] };
        map.set(key, entry);
      }
      entry.bars.push(toGanttBar(event, conflictSet));
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .map(([id, data]) => ({
      id: `${lane}-${id}`,
      label: data.name,
      sublabel: `${data.bars.length} trabalho${data.bars.length > 1 ? 's' : ''}`,
      bars: data.bars,
    }));
}

export function MonthView({ events, conflicts, year, month, lane, emptyState }: MonthViewProps) {
  const conflictSet = useMemo(() => buildConflictSet(conflicts), [conflicts]);
  const rows = useMemo(() => buildRows(events, lane, conflictSet), [events, lane, conflictSet]);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500 shadow-sm">
        {emptyState ?? 'Sem eventos para este mês.'}
      </div>
    );
  }

  return (
    <>
      <div className="hidden min-h-[520px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm md:flex">
        <GanttSidebar rows={rows} />
        <GanttTimeline rows={rows} year={year} month={month} />
      </div>

      <div className="md:hidden">
        <GanttMobileAgenda events={events} year={year} month={month} />
      </div>
    </>
  );
}
