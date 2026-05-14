import { useState } from 'react';
import { Beef, Sprout, Wheat, Apple, Wrench, Eye, MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ListingCategory, ListingCondition, ListingSummary } from '@/types/listing';
import type { ComponentType } from 'react';

interface ListingCardProps {
  readonly listing: ListingSummary;
  readonly onClick?: () => void;
}

const CATEGORY_LABELS: Record<ListingCategory, string> = {
  ANIMALS: 'Animais',
  PLANTS: 'Plantas',
  SEEDS: 'Sementes',
  PRODUCE: 'Produção',
  EQUIPMENT: 'Equipamento',
};

const CATEGORY_ICONS: Record<ListingCategory, ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  ANIMALS: Beef,
  PLANTS: Sprout,
  SEEDS: Wheat,
  PRODUCE: Apple,
  EQUIPMENT: Wrench,
};

const CATEGORY_COLORS: Record<ListingCategory, { text: string; badge: string; placeholder: string }> = {
  ANIMALS:   { text: 'text-amber-600',   badge: 'bg-amber-50 text-amber-700 ring-amber-200/50',     placeholder: 'from-amber-50 to-amber-100/80' },
  PLANTS:    { text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200/50', placeholder: 'from-emerald-50 to-emerald-100/80' },
  SEEDS:     { text: 'text-orange-600',  badge: 'bg-orange-50 text-orange-700 ring-orange-200/50',   placeholder: 'from-orange-50 to-orange-100/80' },
  PRODUCE:   { text: 'text-green-600',   badge: 'bg-green-50 text-green-700 ring-green-200/50',     placeholder: 'from-green-50 to-green-100/80' },
  EQUIPMENT: { text: 'text-slate-500',   badge: 'bg-slate-50 text-slate-600 ring-slate-200/50',     placeholder: 'from-slate-50 to-slate-100/80' },
};

const CONDITION_LABELS: Record<ListingCondition, string> = {
  NEW: 'Novo',
  USED: 'Usado',
  LIKE_NEW: 'Semi-novo',
};

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}m` : `${Math.floor(months / 12)}a`;
}

function formatPrice(price: number): string {
  if (price < 1) {
    return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(price) + ' €';
  }
  return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price) + ' €';
}

export function ListingCard({ listing, onClick }: ListingCardProps) {
  const Icon = CATEGORY_ICONS[listing.category];
  const colors = CATEGORY_COLORS[listing.category];
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !listing.firstPhotoUrl || imgError;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}
      className={cn(
        'group bg-white rounded-2xl border border-neutral-200/80 overflow-hidden cursor-pointer w-full',
        'shadow-sm hover:shadow-md hover:-translate-y-0.5',
        'transition-all duration-200 ease-out',
      )}
    >
      {/* Image area — forced 192px height via inline style */}
      <div
        style={{ position: 'relative', height: '192px', flexShrink: 0, overflow: 'hidden' }}
      >
        {showPlaceholder ? (
          <div
            className={cn('bg-gradient-to-br', colors.placeholder)}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon className={cn('opacity-30', colors.text)} style={{ width: 40, height: 40 }} />
          </div>
        ) : (
          <img
            src={listing.firstPhotoUrl!}
            alt={listing.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Subtle gradient overlay */}
        {!showPlaceholder && (
          <div
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to top, rgba(0,0,0,0.12), transparent)', pointerEvents: 'none' }}
          />
        )}

        {/* Category badge */}
        <span
          className={cn('inline-flex items-center gap-1 rounded-full text-[11px] font-semibold ring-1 backdrop-blur-sm', colors.badge)}
          style={{ position: 'absolute', top: 10, left: 10, padding: '2px 8px' }}
        >
          <Icon style={{ width: 12, height: 12 }} />
          {CATEGORY_LABELS[listing.category]}
        </span>

        {/* Condition badge */}
        {listing.condition && (
          <span
            className="inline-flex items-center rounded-full text-[11px] font-medium bg-white/85 text-neutral-700 ring-1 ring-white/30 backdrop-blur-sm"
            style={{ position: 'absolute', top: 10, right: 10, padding: '2px 8px' }}
          >
            {CONDITION_LABELS[listing.condition]}
          </span>
        )}

        {/* Time ago */}
        {!showPlaceholder && (
          <span
            className="text-[11px] font-medium text-white/90"
            style={{ position: 'absolute', bottom: 8, right: 10, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            {formatRelativeTime(listing.createdAt)}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3
          className="text-[13px] font-semibold text-neutral-800 leading-snug"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}
        >
          {listing.title}
        </h3>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
          {listing.price === null ? (
            <span className="text-sm font-medium italic text-neutral-400">Sob consulta</span>
          ) : (
            <span className="text-lg font-bold text-neutral-900" style={{ letterSpacing: '-0.02em' }}>
              {formatPrice(listing.price)}
            </span>
          )}
          {listing.priceNegotiable && (
            <span
              className="inline-flex items-center rounded text-[10px] font-semibold bg-amber-50 text-amber-700"
              style={{ padding: '1px 6px' }}
            >
              Negociável
            </span>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f5f5f4' }}
        >
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
            <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} className="text-neutral-400" />
            {listing.island}{listing.locationName ? `, ${listing.locationName}` : ''}
          </span>
          {listing.viewsCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-neutral-400" style={{ whiteSpace: 'nowrap' }}>
              <Eye style={{ width: 12, height: 12 }} />
              {listing.viewsCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
