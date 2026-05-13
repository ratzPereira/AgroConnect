import type { CalendarView } from '@/types/calendar';

export interface DateRange {
  from: string;
  to: string;
  days: string[];
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((p) => Number.parseInt(p, 10));
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export function startOfWeek(iso: string): string {
  const d = parseIsoDate(iso);
  const dow = d.getDay();
  const monOffset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + monOffset);
  return isoDate(d);
}

export function startOfMonth(iso: string): string {
  const d = parseIsoDate(iso);
  d.setDate(1);
  return isoDate(d);
}

export function endOfMonth(iso: string): string {
  const d = parseIsoDate(iso);
  d.setMonth(d.getMonth() + 1, 0);
  return isoDate(d);
}

export function rangeForView(view: CalendarView, anchor: string): DateRange {
  if (view === 'day') {
    return { from: anchor, to: anchor, days: [anchor] };
  }
  if (view === 'week') {
    const start = startOfWeek(anchor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return { from: start, to: days[6], days };
  }
  const from = startOfMonth(anchor);
  const to = endOfMonth(anchor);
  const days: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return { from, to, days };
}

const WEEKDAY_LABELS_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function formatDayHeader(iso: string): string {
  const d = parseIsoDate(iso);
  const weekday = WEEKDAY_LABELS_PT[d.getDay()];
  return `${weekday} ${d.getDate()}/${d.getMonth() + 1}`;
}
