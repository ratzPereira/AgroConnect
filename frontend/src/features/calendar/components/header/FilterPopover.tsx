import { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CalendarEvent } from '@/types/calendar';
import type { CalendarFilters } from '../../hooks/useCalendarFilters';

interface FilterPopoverProps {
  readonly events: CalendarEvent[];
  readonly filters: CalendarFilters;
  readonly onChange: (next: Partial<CalendarFilters>) => void;
  readonly onClear: () => void;
}

function toggle<T extends string | number>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const URGENCY_LABELS = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' } as const;
const STATUS_LABELS: Record<string, string> = {
  AWARDED: 'Atribuído',
  IN_PROGRESS: 'Em curso',
  AWAITING_CONFIRMATION: 'A confirmar',
  COMPLETED: 'Concluído',
  RATED: 'Avaliado',
};

export function FilterPopover({ events, filters, onChange, onClear }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (e.target instanceof Node && ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const { operators, machines, categories, islands, statuses } = useMemo(() => {
    const operators = new Map<number, string>();
    const machines = new Map<number, string>();
    const categories = new Set<string>();
    const islands = new Set<string>();
    const statuses = new Set<string>();
    for (const e of events) {
      categories.add(e.categoryName);
      islands.add(e.island);
      statuses.add(e.status);
      for (const a of e.assignments) {
        operators.set(a.teamMemberId, a.teamMemberName);
        if (a.machineId != null) machines.set(a.machineId, a.machineName ?? `Máquina #${a.machineId}`);
      }
    }
    return {
      operators: Array.from(operators.entries()).sort((a, b) => a[1].localeCompare(b[1])),
      machines: Array.from(machines.entries()).sort((a, b) => a[1].localeCompare(b[1])),
      categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
      islands: Array.from(islands).sort((a, b) => a.localeCompare(b)),
      statuses: Array.from(statuses).sort((a, b) => a.localeCompare(b)),
    };
  }, [events]);

  const activeCount =
    filters.operatorIds.length +
    filters.machineIds.length +
    filters.categories.length +
    filters.urgencies.length +
    filters.statuses.length +
    filters.islands.length +
    (filters.includeAllDay ? 0 : 1);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
          activeCount > 0
            ? 'border-primary-300 bg-primary-50 text-primary-700'
            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
        )}
      >
        <Filter className="h-3.5 w-3.5" />
        Filtros
        {activeCount > 0 && (
          <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-neutral-800">Filtrar agenda</h4>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Limpar
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            <FilterGroup
              title="Urgência"
              items={(['HIGH', 'MEDIUM', 'LOW'] as const).map((u) => ({ id: u, label: URGENCY_LABELS[u] }))}
              selected={filters.urgencies}
              onToggle={(id) => onChange({ urgencies: toggle(filters.urgencies, id) })}
            />
            {statuses.length > 0 && (
              <FilterGroup
                title="Estado"
                items={statuses.map((s) => ({ id: s, label: STATUS_LABELS[s] ?? s }))}
                selected={filters.statuses}
                onToggle={(id) => onChange({ statuses: toggle(filters.statuses, id) })}
              />
            )}
            {operators.length > 0 && (
              <FilterGroup
                title="Operadores"
                items={operators.map(([id, label]) => ({ id, label }))}
                selected={filters.operatorIds}
                onToggle={(id) => onChange({ operatorIds: toggle(filters.operatorIds, id) })}
              />
            )}
            {machines.length > 0 && (
              <FilterGroup
                title="Máquinas"
                items={machines.map(([id, label]) => ({ id, label }))}
                selected={filters.machineIds}
                onToggle={(id) => onChange({ machineIds: toggle(filters.machineIds, id) })}
              />
            )}
            {categories.length > 0 && (
              <FilterGroup
                title="Categoria"
                items={categories.map((c) => ({ id: c, label: c }))}
                selected={filters.categories}
                onToggle={(id) => onChange({ categories: toggle(filters.categories, id) })}
              />
            )}
            {islands.length > 0 && (
              <FilterGroup
                title="Ilha"
                items={islands.map((i) => ({ id: i, label: i }))}
                selected={filters.islands}
                onToggle={(id) => onChange({ islands: toggle(filters.islands, id) })}
              />
            )}
            <label className="flex items-center gap-2 rounded-md border border-neutral-100 px-2.5 py-2 text-xs text-neutral-700">
              <input
                type="checkbox"
                checked={filters.includeAllDay}
                onChange={(e) => onChange({ includeAllDay: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600"
              />
              <span>Incluir eventos de dia inteiro</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterGroupProps<T extends string | number> {
  readonly title: string;
  readonly items: ReadonlyArray<{ id: T; label: string }>;
  readonly selected: readonly T[];
  readonly onToggle: (id: T) => void;
}

function FilterGroup<T extends string | number>({ title, items, selected, onToggle }: FilterGroupProps<T>) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((it) => {
          const active = selected.includes(it.id);
          return (
            <button
              key={String(it.id)}
              type="button"
              onClick={() => onToggle(it.id)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs transition-colors',
                active
                  ? 'border-primary-400 bg-primary-100 text-primary-800'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
              )}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
