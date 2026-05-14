import type { CalendarEvent } from '@/types/calendar';
import { formatTime, parseTime, slotToTime, SLOTS_PER_DAY } from './timeMath';

export interface ProposedSchedule {
  executionId: number;
  dayIso: string;
  startSlot: number;
  spanSlots: number;
  operatorIds: number[];
  machineIds: number[];
}

function sharesResource(e: CalendarEvent, proposed: ProposedSchedule): boolean {
  const sharesOperator = e.assignments.some((a) => proposed.operatorIds.includes(a.teamMemberId));
  const sharesMachine = e.assignments.some(
    (a) => a.machineId != null && proposed.machineIds.includes(a.machineId),
  );
  return sharesOperator || sharesMachine;
}

function checkAgainstEvent(
  e: CalendarEvent,
  proposed: ProposedSchedule,
): { conflict: boolean; reason?: string } | null {
  if (e.executionId === proposed.executionId) return null;
  if (e.scheduledDate > proposed.dayIso || e.scheduledEndDate < proposed.dayIso) return null;
  if (!sharesResource(e, proposed)) return null;
  if (e.scheduledAllDay) {
    return { conflict: true, reason: `Sobrepõe-se a "${e.requestTitle}" (dia inteiro)` };
  }
  const start = parseTime(e.scheduledStartTime);
  const end = parseTime(e.scheduledEndTime);
  if (!start || !end) return null;

  const otherStartSlot = e.scheduledDate === proposed.dayIso ? toSlot(start.hour, start.minute) : 0;
  const otherEndSlot = e.scheduledEndDate === proposed.dayIso ? toSlot(end.hour, end.minute) : SLOTS_PER_DAY;
  const proposedEnd = proposed.startSlot + proposed.spanSlots;
  if (proposed.startSlot < otherEndSlot && proposedEnd > otherStartSlot) {
    return {
      conflict: true,
      reason: `Sobrepõe-se a "${e.requestTitle}" (${formatTime(start)}–${formatTime(end)})`,
    };
  }
  return null;
}

export function eventsConflict(
  proposed: ProposedSchedule,
  others: CalendarEvent[],
): { conflict: boolean; reason?: string } {
  for (const e of others) {
    const result = checkAgainstEvent(e, proposed);
    if (result) return result;
  }
  return { conflict: false };
}

function toSlot(hour: number, minute: number): number {
  return Math.max(0, (hour - 6) * 2 + minute / 30);
}

export function describeProposedTime(startSlot: number, spanSlots: number): string {
  const s = slotToTime(startSlot);
  const e = slotToTime(startSlot + spanSlots);
  return `${formatTime(s)}–${formatTime(e)}`;
}
