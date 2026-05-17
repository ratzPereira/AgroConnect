export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 20;
export const SLOT_MINUTES = 30;
export const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
export const SLOTS_PER_DAY = (DAY_END_HOUR - DAY_START_HOUR) * SLOTS_PER_HOUR;
export const ALL_DAY_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

export interface ParsedTime {
  hour: number;
  minute: number;
}

export function parseTime(value: string | null | undefined): ParsedTime | null {
  if (!value) return null;
  const [h, m] = value.split(':');
  const hour = Number.parseInt(h, 10);
  const minute = Number.parseInt(m, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return { hour, minute };
}

export function formatTime(time: ParsedTime | null | undefined): string {
  if (!time) return '';
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
}

export function timeToSlot(time: ParsedTime): number {
  return (time.hour - DAY_START_HOUR) * SLOTS_PER_HOUR + time.minute / SLOT_MINUTES;
}

export function slotToTime(slot: number): ParsedTime {
  const clamped = Math.max(0, Math.min(SLOTS_PER_DAY, slot));
  const totalMinutes = clamped * SLOT_MINUTES;
  const startMinutes = DAY_START_HOUR * 60 + totalMinutes;
  return {
    hour: Math.floor(startMinutes / 60),
    minute: startMinutes % 60,
  };
}

export function minutesBetween(start: ParsedTime, end: ParsedTime): number {
  return end.hour * 60 + end.minute - (start.hour * 60 + start.minute);
}

export function clampSlot(slot: number): number {
  return Math.max(0, Math.min(SLOTS_PER_DAY, slot));
}

export function snapSlot(slotFloat: number): number {
  return clampSlot(Math.round(slotFloat));
}

export function buildHourTicks(): number[] {
  const ticks: number[] = [];
  for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) {
    ticks.push(h);
  }
  return ticks;
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
