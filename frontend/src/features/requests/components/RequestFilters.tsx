import { useState, useEffect, useRef } from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

const AZORES_ISLANDS = [
  'São Miguel', 'Terceira', 'Faial', 'Pico', 'São Jorge',
  'Flores', 'Corvo', 'Graciosa', 'Santa Maria',
];

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
];

export interface FilterState {
  search: string;
  urgency: string;
  island: string;
}

interface RequestFiltersProps {
  readonly filters: FilterState;
  readonly onFilterChange: (filters: FilterState) => void;
}

export function RequestFilters({ filters, onFilterChange }: RequestFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ ...filters, search: searchInput });
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput, filters, onFilterChange]);

  function clearAll() {
    setSearchInput('');
    onFilterChange({ search: '', urgency: '', island: '' });
  }

  const hasFilters = filters.search || filters.urgency || filters.island;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Pesquisar pedidos..."
            className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
          <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
        </Button>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearAll}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="flex flex-wrap gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
          <div>
            <label htmlFor="rf-urgency" className="text-xs font-medium text-neutral-600 block mb-1">Urgência</label>
            <select
              id="rf-urgency"
              value={filters.urgency}
              onChange={(e) => onFilterChange({ ...filters, urgency: e.target.value })}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas</option>
              {URGENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rf-island" className="text-xs font-medium text-neutral-600 block mb-1">Ilha</label>
            <select
              id="rf-island"
              value={filters.island}
              onChange={(e) => onFilterChange({ ...filters, island: e.target.value })}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas</option>
              {AZORES_ISLANDS.map((island) => (
                <option key={island} value={island}>{island}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
