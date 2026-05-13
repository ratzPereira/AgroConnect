import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarView } from '@/types/calendar';
import { addDays, parseIsoDate, isoDate } from '../../utils/viewRange';

interface DateNavProps {
  view: CalendarView;
  anchor: string;
  onChange: (next: string) => void;
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function shiftAnchor(view: CalendarView, anchor: string, delta: number): string {
  if (view === 'day') return addDays(anchor, delta);
  if (view === 'week') return addDays(anchor, delta * 7);
  const d = parseIsoDate(anchor);
  d.setMonth(d.getMonth() + delta, 1);
  return isoDate(d);
}

function labelFor(view: CalendarView, anchor: string): string {
  const d = parseIsoDate(anchor);
  if (view === 'day') {
    return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (view === 'week') {
    return `Semana de ${d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }
  return `${MONTH_NAMES_PT[d.getMonth()]} ${d.getFullYear()}`;
}

function todayIso(): string {
  return isoDate(new Date());
}

export function DateNav({ view, anchor, onChange }: DateNavProps) {
  const isToday = anchor === todayIso();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(shiftAnchor(view, anchor, -1))}
        className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="min-w-[220px] text-center text-sm font-semibold text-neutral-800 capitalize font-display">
        {labelFor(view, anchor)}
      </span>
      <button
        type="button"
        onClick={() => onChange(shiftAnchor(view, anchor, 1))}
        className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
        aria-label="Seguinte"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      {!isToday && (
        <button
          type="button"
          onClick={() => onChange(todayIso())}
          className="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
        >
          Hoje
        </button>
      )}
    </div>
  );
}
