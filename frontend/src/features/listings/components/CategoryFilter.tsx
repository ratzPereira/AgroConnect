import { Beef, Sprout, Wheat, Apple, Wrench, LayoutGrid } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ListingCategory } from '@/types/listing';
import type { ComponentType } from 'react';

interface CategoryFilterProps {
  selected: ListingCategory | null;
  onSelect: (category: ListingCategory | null) => void;
}

interface CategoryPill {
  value: ListingCategory | null;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const PILLS: CategoryPill[] = [
  { value: null, label: 'Todos', icon: LayoutGrid },
  { value: 'ANIMALS', label: 'Animais', icon: Beef },
  { value: 'PLANTS', label: 'Plantas', icon: Sprout },
  { value: 'SEEDS', label: 'Sementes', icon: Wheat },
  { value: 'PRODUCE', label: 'Produção', icon: Apple },
  { value: 'EQUIPMENT', label: 'Equipamento', icon: Wrench },
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
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200',
              isActive
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
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
