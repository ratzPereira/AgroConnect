import { User, Wrench, Briefcase } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CalendarLane } from '@/types/calendar';

const OPTIONS: { key: CalendarLane; label: string; icon: typeof User }[] = [
  { key: 'operators', label: 'Operadores', icon: User },
  { key: 'machines', label: 'Máquinas', icon: Wrench },
  { key: 'jobs', label: 'Trabalhos', icon: Briefcase },
];

interface LaneSwitcherProps {
  value: CalendarLane;
  onChange: (lane: CalendarLane) => void;
}

export function LaneSwitcher({ value, onChange }: LaneSwitcherProps) {
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
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
