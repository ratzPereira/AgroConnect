import { CalendarDays, CalendarRange, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CalendarView } from '@/types/calendar';

const OPTIONS: { key: CalendarView; label: string; icon: typeof Calendar }[] = [
  { key: 'day', label: 'Dia', icon: CalendarDays },
  { key: 'week', label: 'Semana', icon: CalendarRange },
  { key: 'month', label: 'Mês', icon: Calendar },
];

interface ViewSwitcherProps {
  readonly value: CalendarView;
  readonly onChange: (view: CalendarView) => void;
}

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 p-1">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
              active ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
            )}
            aria-pressed={active}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
