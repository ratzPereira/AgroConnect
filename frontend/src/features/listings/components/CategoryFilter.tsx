import { Beef, Sprout, Wheat, Apple, Wrench, LayoutGrid } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ListingCategory } from '@/types/listing';
import type { ComponentType } from 'react';

interface CategoryFilterProps {
  readonly selected: ListingCategory | null;
  readonly onSelect: (category: ListingCategory | null) => void;
}

interface CategoryPill {
  value: ListingCategory | null;
  label: string;
  icon: ComponentType<{ className?: string }>;
  activeClass: string;
}

const PILLS: CategoryPill[] = [
  { value: null, label: 'Todos', icon: LayoutGrid, activeClass: 'bg-neutral-800 text-white' },
  { value: 'ANIMALS', label: 'Animais', icon: Beef, activeClass: 'bg-amber-600 text-white' },
  { value: 'PLANTS', label: 'Plantas', icon: Sprout, activeClass: 'bg-emerald-600 text-white' },
  { value: 'SEEDS', label: 'Sementes', icon: Wheat, activeClass: 'bg-orange-500 text-white' },
  { value: 'PRODUCE', label: 'Produção', icon: Apple, activeClass: 'bg-green-600 text-white' },
  { value: 'EQUIPMENT', label: 'Equipamento', icon: Wrench, activeClass: 'bg-slate-600 text-white' },
];

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {PILLS.map((pill) => {
        const isActive = selected === pill.value;
        const Icon = pill.icon;

        return (
          <button
            key={pill.value ?? 'all'}
            type="button"
            onClick={() => onSelect(pill.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap',
              'transition-all duration-200 ease-out shadow-sm',
              isActive
                ? cn(pill.activeClass, 'shadow-md')
                : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:ring-neutral-300 hover:bg-neutral-50',
            )}
          >
            <Icon className="h-4 w-4" />
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
