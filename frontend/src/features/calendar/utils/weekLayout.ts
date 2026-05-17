import type { CalendarEvent } from '@/types/calendar';
import { DAY_START_HOUR, DAY_END_HOUR, parseTime } from './timeMath';
import { packIntervals } from './lanePacking';

export const HOUR_HEIGHT_PX = 56;
const WORKING_HOURS = DAY_END_HOUR - DAY_START_HOUR;
export const DAY_TOTAL_HEIGHT_PX = WORKING_HOURS * HOUR_HEIGHT_PX;

export interface DayLayoutItem {
  event: CalendarEvent;
  top: number;
  height: number;
  laneIndex: number;
  laneCount: number;
  hasConflict: boolean;
}

interface MinuteSpan {
  startMinute: number;
  endMinute: number;
}

function computeSpan(event: CalendarEvent, dayIso: string): MinuteSpan | null {
  if (event.scheduledAllDay) return null;
  if (dayIso < event.scheduledDate || dayIso > event.scheduledEndDate) return null;

  const isFirstDay = dayIso === event.scheduledDate;
  const isLastDay = dayIso === event.scheduledEndDate;

  const startTime = parseTime(event.scheduledStartTime);
  const endTime = parseTime(event.scheduledEndTime);
  if (!startTime || !endTime) return null;

  const startMinute = isFirstDay ? startTime.hour * 60 + startTime.minute : DAY_START_HOUR * 60;
  const endMinute = isLastDay ? endTime.hour * 60 + endTime.minute : DAY_END_HOUR * 60;

  const clampedStart = Math.max(startMinute, DAY_START_HOUR * 60);
  const clampedEnd = Math.min(endMinute, DAY_END_HOUR * 60);
  if (clampedEnd <= clampedStart) return null;

  return { startMinute: clampedStart, endMinute: clampedEnd };
}

export function buildDayLayout(
  events: CalendarEvent[],
  dayIso: string,
  conflictSet: Set<number>,
): DayLayoutItem[] {
  const spans: { event: CalendarEvent; start: number; end: number }[] = [];
  for (const e of events) {
    const span = computeSpan(e, dayIso);
    if (span) spans.push({ event: e, start: span.startMinute, end: span.endMinute });
  }
  const packed = packIntervals(spans);
  return packed.map((p) => {
    const minutesFromStart = p.start - DAY_START_HOUR * 60;
    const durationMinutes = p.end - p.start;
    return {
      event: p.event,
      top: (minutesFromStart / 60) * HOUR_HEIGHT_PX,
      height: Math.max(20, (durationMinutes / 60) * HOUR_HEIGHT_PX),
      laneIndex: p.laneIndex,
      laneCount: p.laneCount,
      hasConflict: conflictSet.has(p.event.executionId),
    };
  });
}
