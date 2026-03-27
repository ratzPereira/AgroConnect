import { Beef, Sprout, Wheat, Apple, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import type { ListingCategory, ListingCondition, ListingSummary } from '@/types/listing';
import type { ComponentType } from 'react';

interface ListingCardProps {
  listing: ListingSummary;
  onClick?: () => void;
}

const CATEGORY_LABELS: Record<ListingCategory, string> = {
  ANIMALS: 'Animais',
  PLANTS: 'Plantas',
  SEEDS: 'Sementes',
  PRODUCE: 'Produção',
  EQUIPMENT: 'Equipamento',
};

const CATEGORY_ICONS: Record<ListingCategory, ComponentType<{ className?: string }>> = {
  ANIMALS: Beef,
  PLANTS: Sprout,
  SEEDS: Wheat,
  PRODUCE: Apple,
  EQUIPMENT: Wrench,
};

const CATEGORY_BORDER_COLORS: Record<ListingCategory, string> = {
  ANIMALS: 'border-l-earth-400',
  PLANTS: 'border-l-leaf-400',
  SEEDS: 'border-l-warning-400',
  PRODUCE: 'border-l-primary-400',
  EQUIPMENT: 'border-l-neutral-400',
};

const CATEGORY_BG_COLORS: Record<ListingCategory, string> = {
  ANIMALS: 'bg-earth-50',
  PLANTS: 'bg-leaf-50',
  SEEDS: 'bg-warning-50',
  PRODUCE: 'bg-primary-50',
  EQUIPMENT: 'bg-neutral-100',
};

const CATEGORY_ICON_COLORS: Record<ListingCategory, string> = {
  ANIMALS: 'text-earth-500',
  PLANTS: 'text-leaf-500',
  SEEDS: 'text-warning-500',
  PRODUCE: 'text-primary-500',
  EQUIPMENT: 'text-neutral-500',
};

const CATEGORY_BADGE_VARIANTS: Record<ListingCategory, 'default' | 'success' | 'warning' | 'neutral'> = {
  ANIMALS: 'warning',
  PLANTS: 'success',
  SEEDS: 'warning',
  PRODUCE: 'default',
  EQUIPMENT: 'neutral',
};

const CONDITION_LABELS: Record<ListingCondition, string> = {
  NEW: 'Novo',
  USED: 'Usado',
  LIKE_NEW: 'Semi-novo',
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 30) return `${diffDays}d`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}m`;
  return `${Math.floor(diffMonths / 12)}a`;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function ListingCard({ listing, onClick }: ListingCardProps) {
  const Icon = CATEGORY_ICONS[listing.category];

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-neutral-200 border-l-4 shadow-sm',
        'hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden',
        CATEGORY_BORDER_COLORS[listing.category],
      )}
    >
      {/* Photo area — 16:10 aspect ratio */}
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
        {listing.firstPhotoUrl ? (
          <img
            src={listing.firstPhotoUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center', CATEGORY_BG_COLORS[listing.category])}>
            <Icon className={cn('h-12 w-12', CATEGORY_ICON_COLORS[listing.category])} />
          </div>
        )}

        {/* Category badge — top-right */}
        <div className="absolute top-2 right-2">
          <Badge variant={CATEGORY_BADGE_VARIANTS[listing.category]} size="sm">
            {CATEGORY_LABELS[listing.category]}
          </Badge>
        </div>

        {/* Condition badge — top-left */}
        {listing.condition && (
          <div className="absolute top-2 left-2">
            <Badge variant="neutral" size="sm">
              {CONDITION_LABELS[listing.condition]}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-neutral-900 truncate">
          {listing.title}
        </h3>

        <div className="flex items-center gap-2 mt-1">
          {listing.price !== null ? (
            <span className="text-lg font-bold text-neutral-900">
              {formatPrice(listing.price)}
            </span>
          ) : (
            <span className="text-sm italic text-neutral-500">Sob consulta</span>
          )}
          {listing.priceNegotiable && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-100 text-warning-700">
              Negociável
            </span>
          )}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-neutral-500 truncate">
            {listing.island}
            {listing.locationName ? `, ${listing.locationName}` : ''}
          </span>
          <span className="text-xs text-neutral-400 whitespace-nowrap ml-2">
            {formatRelativeTime(listing.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
