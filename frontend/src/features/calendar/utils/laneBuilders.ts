import type { CalendarEvent, CalendarLane, ConflictResponse } from '@/types/calendar';
import { SLOTS_PER_DAY, parseTime, timeToSlot } from './timeMath';

export interface LanePlacement {
  startSlot: number;
  spanSlots: number;
  laneRow: number;
}

export interface LaneEvent {
  event: CalendarEvent;
  placement: LanePlacement;
  hasConflict: boolean;
}

export interface LaneGroup {
  id: string;
  label: string;
  sublabel?: string;
  resourceType: 'operator' | 'machine' | 'job';
  resourceId: number | null;
  events: LaneEvent[];
  rowsCount: number;
}

export interface BuildLanesOptions {
  events: CalendarEvent[];
  conflicts: ConflictResponse[];
  lane: CalendarLane;
  dayIso: string;
  dayIndex?: number;
  daysCount?: number;
}

export function buildConflictSet(conflicts: ConflictResponse[]): Set<number> {
  const set = new Set<number>();
  for (const c of conflicts) {
    for (const e of c.conflictingEvents) set.add(e.executionId);
  }
  return set;
}

export function computePlacement(
  event: CalendarEvent,
  dayIso: string,
  dayIndex = 0,
): LanePlacement | null {
  if (event.scheduledAllDay) return null;
  if (dayIso < event.scheduledDate || dayIso > event.scheduledEndDate) return null;

  const isFirstDay = dayIso === event.scheduledDate;
  const isLastDay = dayIso === event.scheduledEndDate;

  const start = parseTime(event.scheduledStartTime);
  const end = parseTime(event.scheduledEndTime);
  if (!start || !end) return null;

  const startSlotInDay = isFirstDay ? timeToSlot(start) : 0;
  const endSlotInDay = isLastDay ? timeToSlot(end) : SLOTS_PER_DAY;
  const spanInDay = Math.max(1, endSlotInDay - startSlotInDay);

  return {
    startSlot: dayIndex * SLOTS_PER_DAY + startSlotInDay,
    spanSlots: spanInDay,
    laneRow: 1,
  };
}

export function packRows(items: LaneEvent[]): LaneEvent[] {
  const sorted = [...items].sort((a, b) =>
    a.placement.startSlot === b.placement.startSlot
      ? a.placement.spanSlots - b.placement.spanSlots
      : a.placement.startSlot - b.placement.startSlot,
  );
  const rowEnds: number[] = [];
  for (const it of sorted) {
    const start = it.placement.startSlot;
    const end = start + it.placement.spanSlots;
    let placed = false;
    for (let r = 0; r < rowEnds.length; r++) {
      if (rowEnds[r] <= start) {
        it.placement.laneRow = r + 1;
        rowEnds[r] = end;
        placed = true;
        break;
      }
    }
    if (!placed) {
      it.placement.laneRow = rowEnds.length + 1;
      rowEnds.push(end);
    }
  }
  return sorted;
}

interface BuildOptionsBase {
  events: CalendarEvent[];
  conflicts: ConflictResponse[];
  dayIso?: string;
  days?: string[];
}

interface BuildLanesForRangeOptions extends BuildOptionsBase {
  lane: CalendarLane;
}

export function buildLanesForRange({
  events,
  conflicts,
  lane,
  days = [],
}: BuildLanesForRangeOptions): LaneGroup[] {
  const conflictSet = buildConflictSet(conflicts);
  const groupMap = new Map<
    string,
    {
      label: string;
      sublabel?: string;
      resourceType: 'operator' | 'machine' | 'job';
      resourceId: number | null;
      events: LaneEvent[];
    }
  >();

  function ensureGroup(
    id: string,
    label: string,
    resourceType: 'operator' | 'machine' | 'job',
    resourceId: number | null,
    sublabel?: string,
  ): LaneEvent[] {
    let entry = groupMap.get(id);
    if (!entry) {
      entry = { label, sublabel, resourceType, resourceId, events: [] };
      groupMap.set(id, entry);
    }
    return entry.events;
  }

  for (const event of events) {
    const hasConflict = conflictSet.has(event.executionId);
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const dayIso = days[dayIdx];
      const placement = computePlacement(event, dayIso, dayIdx);
      if (!placement) continue;

      if (lane === 'operators') {
        if (event.assignments.length === 0) {
          ensureGroup('op-none', 'Sem operador', 'operator', null, undefined).push({
            event,
            placement: { ...placement },
            hasConflict,
          });
        } else {
          for (const a of event.assignments) {
            ensureGroup(`op-${a.teamMemberId}`, a.teamMemberName, 'operator', a.teamMemberId, 'Operador').push(
              { event, placement: { ...placement }, hasConflict },
            );
          }
        }
      } else if (lane === 'machines') {
        const machineAssignments = event.assignments.filter((a) => a.machineId != null);
        if (machineAssignments.length === 0) continue;
        for (const a of machineAssignments) {
          ensureGroup(
            `m-${a.machineId}`,
            a.machineName ?? `Máquina #${a.machineId}`,
            'machine',
            a.machineId,
            'Máquina',
          ).push({ event, placement: { ...placement }, hasConflict });
        }
      } else {
        ensureGroup(
          `job-${event.executionId}`,
          event.requestTitle,
          'job',
          event.executionId,
          event.categoryName,
        ).push({ event, placement: { ...placement }, hasConflict });
      }
    }
  }

  return Array.from(groupMap.entries())
    .map(([id, g]) => {
      const packed = packRows(g.events);
      const rowsCount = packed.reduce((m, ev) => Math.max(m, ev.placement.laneRow), 0) || 1;
      return {
        id,
        label: g.label,
        sublabel: g.sublabel,
        resourceType: g.resourceType,
        resourceId: g.resourceId,
        events: packed,
        rowsCount,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
