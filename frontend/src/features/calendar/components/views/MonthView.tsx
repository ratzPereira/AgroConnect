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
  readonly events: CalendarEvent[];
  readonly conflicts: ConflictResponse[];
  readonly year: number;
  readonly month: number;
  readonly lane: CalendarLane;
  readonly emptyState?: React.ReactNode;
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

function buildJobRows(events: CalendarEvent[], conflictSet: Set<number>): GanttRow[] {
  return events.map((event) => ({
    id: `job-${event.executionId}`,
    label: event.requestTitle,
    sublabel: event.categoryName,
    bars: [toGanttBar(event, conflictSet)],
  }));
}

function getAssignmentKeyAndName(
  a: CalendarEvent['assignments'][number],
  lane: 'machines' | 'operators',
): { key: number; name: string } | null {
  if (lane === 'machines') {
    if (a.machineId == null) return null;
    return { key: a.machineId, name: a.machineName ?? `Máquina #${a.machineId}` };
  }
  return { key: a.teamMemberId, name: a.teamMemberName };
}

function buildResourceRows(
  events: CalendarEvent[],
  lane: 'machines' | 'operators',
  conflictSet: Set<number>,
): GanttRow[] {
  const map = new Map<number, { name: string; bars: GanttBar[] }>();
  for (const event of events) {
    for (const a of event.assignments) {
      const meta = getAssignmentKeyAndName(a, lane);
      if (!meta) continue;
      let entry = map.get(meta.key);
      if (!entry) {
        entry = { name: meta.name, bars: [] };
        map.set(meta.key, entry);
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

function buildRows(
  events: CalendarEvent[],
  lane: CalendarLane,
  conflictSet: Set<number>,
): GanttRow[] {
  if (lane === 'jobs') return buildJobRows(events, conflictSet);
  return buildResourceRows(events, lane, conflictSet);
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
