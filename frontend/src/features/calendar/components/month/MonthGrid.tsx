import { useMemo, type MouseEvent } from 'react';
import type { CalendarEvent, ConflictResponse } from '@/types/calendar';
import { MonthDayCell } from './MonthDayCell';
import { buildConflictSet } from '../../utils/laneBuilders';
import { todayIso } from '../../utils/timeMath';

interface MonthGridProps {
  readonly year: number;
  readonly month: number;
  readonly events: CalendarEvent[];
  readonly conflicts: ConflictResponse[];
  readonly onCellClick: (dayIso: string) => void;
  readonly onEventClick?: (event: CalendarEvent, mouse: MouseEvent<HTMLButtonElement>) => void;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface Cell {
  dayIso: string;
  isCurrentMonth: boolean;
}

function isoForDate(year: number, month: number, day: number): string {
  const d = new Date(year, month, day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildCells(year: number, month: number): Cell[] {
  const firstOfMonth = new Date(year, month, 1);
  const leadingDays = firstOfMonth.getDay();
  const startDate = new Date(year, month, 1 - leadingDays);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lastOfMonth = new Date(year, month, daysInMonth);
  const trailingDays = 6 - lastOfMonth.getDay();
  const totalCells = leadingDays + daysInMonth + trailingDays;
  const cells: Cell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    cells.push({
      dayIso: isoForDate(d.getFullYear(), d.getMonth(), d.getDate()),
      isCurrentMonth: d.getMonth() === month,
    });
  }
  return cells;
}

function eventsByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const [sy, sm, sd] = e.scheduledDate.split('-').map(Number);
    const [ey, em, ed] = e.scheduledEndDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const iso = isoForDate(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      const arr = map.get(iso) ?? [];
      arr.push(e);
      map.set(iso, arr);
    }
  }
  return map;
}

export function MonthGrid({
  year,
  month,
  events,
  conflicts,
  onCellClick,
  onEventClick,
}: MonthGridProps) {
  const conflictSet = useMemo(() => buildConflictSet(conflicts), [conflicts]);
  const cells = useMemo(() => buildCells(year, month), [year, month]);
  const eventsMap = useMemo(() => eventsByDay(events), [events]);
  const today = todayIso();

  const maxLoad = useMemo(() => {
    let max = 0;
    for (const arr of eventsMap.values()) max = Math.max(max, arr.length);
    return max || 1;
  }, [eventsMap]);

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="border-r border-neutral-200 px-2 py-2 text-center text-[11px] font-semibold uppercase text-neutral-600 last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-l border-neutral-200">
        {cells.map((cell) => {
          const dayEvents = eventsMap.get(cell.dayIso) ?? [];
          const loadIntensity = dayEvents.length / maxLoad;
          return (
            <MonthDayCell
              key={cell.dayIso}
              dayIso={cell.dayIso}
              events={dayEvents}
              conflictSet={conflictSet}
              isCurrentMonth={cell.isCurrentMonth}
              isToday={cell.dayIso === today}
              loadIntensity={loadIntensity}
              onCellClick={onCellClick}
              onEventClick={onEventClick}
            />
          );
        })}
      </div>
    </div>
  );
}
