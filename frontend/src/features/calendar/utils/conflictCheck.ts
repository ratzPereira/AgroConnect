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

export function eventsConflict(
  proposed: ProposedSchedule,
  others: CalendarEvent[],
): { conflict: boolean; reason?: string } {
  for (const e of others) {
    if (e.executionId === proposed.executionId) continue;
    if (e.scheduledDate > proposed.dayIso || e.scheduledEndDate < proposed.dayIso) continue;

    const sharesOperator = e.assignments.some((a) => proposed.operatorIds.includes(a.teamMemberId));
    const sharesMachine = e.assignments.some(
      (a) => a.machineId != null && proposed.machineIds.includes(a.machineId),
    );
    if (!sharesOperator && !sharesMachine) continue;

    if (e.scheduledAllDay) {
      return { conflict: true, reason: `Sobrepõe-se a "${e.requestTitle}" (dia inteiro)` };
    }

    const isFirstDay = e.scheduledDate === proposed.dayIso;
    const isLastDay = e.scheduledEndDate === proposed.dayIso;
    const start = parseTime(e.scheduledStartTime);
    const end = parseTime(e.scheduledEndTime);
    if (!start || !end) continue;

    const otherStartSlot = isFirstDay ? toSlot(start.hour, start.minute) : 0;
    const otherEndSlot = isLastDay ? toSlot(end.hour, end.minute) : SLOTS_PER_DAY;

    const proposedEnd = proposed.startSlot + proposed.spanSlots;
    if (proposed.startSlot < otherEndSlot && proposedEnd > otherStartSlot) {
      return {
        conflict: true,
        reason: `Sobrepõe-se a "${e.requestTitle}" (${formatTime(start)}–${formatTime(end)})`,
      };
    }
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
