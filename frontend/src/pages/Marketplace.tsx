import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchListings } from '@/api/listings';
import { AnimatedPage } from '@/components/AnimatedPage';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { CategoryFilter } from '@/features/listings/components/CategoryFilter';
import { AzoresMap } from '@/components/AzoresMap';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Search, LayoutGrid, Map, Plus, MapPin, ChevronLeft, ChevronRight, ShoppingBag,
} from 'lucide-react';
import { AZORES_ISLANDS } from '@/features/requests/data/azoresLocations';
import { cn } from '@/utils/cn';
import type { ListingCategory } from '@/types/listing';
import type { RequestPin } from '@/types/pin';

type ViewMode = 'grid' | 'map';

const ISLAND_OPTIONS = [
  { value: '', label: 'Todas as ilhas' },
  ...AZORES_ISLANDS.map((i) => ({ value: i.name, label: i.name })),
];

const CATEGORY_PIN_COLORS: Record<ListingCategory, string> = {
  ANIMALS: '#C9A86E',
  PLANTS: '#5ACA2D',
  SEEDS: '#F5A623',
  PRODUCE: '#3DA63D',
  EQUIPMENT: '#B0ADA3',
};

export function Marketplace() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') ?? '0');
  const searchQuery = searchParams.get('search') ?? '';
  const categoryParam = (searchParams.get('category') ?? '') as ListingCategory | '';
  const islandParam = searchParams.get('island') ?? '';
  const minPriceParam = searchParams.get('minPrice') ?? '';
  const maxPriceParam = searchParams.get('maxPrice') ?? '';

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [nearMe, setNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const category = categoryParam || null;

  // Update search params helper
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, val]) => {
        if (val) {
          newParams.set(key, val);
        } else {
          newParams.delete(key);
        }
      });
      // Reset page on filter change (unless explicitly changing page)
      if (!('page' in updates)) {
        newParams.delete('page');
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['listings', page, searchQuery, categoryParam, islandParam, minPriceParam, maxPriceParam, nearMe, userLocation?.lat, userLocation?.lng],
    queryFn: () =>
      searchListings({
        page,
        size: 20,
        search: searchQuery || undefined,
        category: categoryParam || undefined,
        island: islandParam || undefined,
        minPrice: minPriceParam ? Number(minPriceParam) : undefined,
        maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
        latitude: nearMe && userLocation ? userLocation.lat : undefined,
        longitude: nearMe && userLocation ? userLocation.lng : undefined,
        radiusKm: nearMe && userLocation ? 50 : undefined,
      }),
  });

  const listings = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  // Map pins from listings
  const mapPins: RequestPin[] = useMemo(
    () =>
      listings.map((l) => ({
        id: l.id,
        latitude: l.latitude,
        longitude: l.longitude,
        status: 'PUBLISHED' as const,
        title: l.title,
        categoryName: l.category,
        urgency: 'LOW' as const,
        island: l.island,
      })),
    [listings],
  );

  function handleNearMe() {
    if (nearMe) {
      setNearMe(false);
      setUserLocation(null);
      return;
    }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMe(true);
      },
      () => {
        // Geolocation denied or unavailable
      },
    );
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('search') as HTMLInputElement;
    updateParams({ search: input.value });
  }

  return (
    <AnimatedPage>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900">
          Marketplace
        </h1>
        <Button onClick={() => navigate('/marketplace/new')} size="sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Publicar Anúncio</span>
        </Button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            name="search"
            type="text"
            defaultValue={searchQuery}
            placeholder="Pesquisar anúncios..."
            className={cn(
              'block w-full rounded-lg border border-neutral-300 pl-10 pr-4 py-2.5 text-sm',
              'placeholder:text-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            )}
          />
        </div>
      </form>

      {/* Category pills */}
      <div className="mb-4">
        <CategoryFilter
          selected={category as ListingCategory | null}
          onSelect={(cat) => updateParams({ category: cat ?? '' })}
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Island filter */}
        <select
          value={islandParam}
          onChange={(e) => updateParams({ island: e.target.value })}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {ISLAND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Price range */}
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            placeholder="Min"
            className="w-20"
            value={minPriceParam}
            onChange={(e) => updateParams({ minPrice: e.target.value })}
          />
          <span className="text-neutral-400 text-sm">-</span>
          <Input
            type="number"
            placeholder="Max"
            className="w-20"
            value={maxPriceParam}
            onChange={(e) => updateParams({ maxPrice: e.target.value })}
          />
          <span className="text-xs text-neutral-400">EUR</span>
        </div>

        {/* Near me toggle */}
        <button
          type="button"
          onClick={handleNearMe}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors duration-200',
            nearMe
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50',
          )}
        >
          <MapPin className="h-4 w-4" />
          Perto de mim
        </button>

        {/* View mode toggle */}
        <div className="ml-auto flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-1.5 rounded-md transition-colors duration-150',
              viewMode === 'grid' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500',
            )}
            aria-label="Vista em grelha"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={cn(
              'p-1.5 rounded-md transition-colors duration-150',
              viewMode === 'map' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500',
            )}
            aria-label="Vista no mapa"
          >
            <Map className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              <Skeleton className="aspect-[16/10] w-full" />
              <div className="p-3 space-y-2">
                <Skeleton.Line className="h-4 w-3/4" />
                <Skeleton.Line className="h-6 w-20" />
                <Skeleton.Line className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          illustration={<ShoppingBag className="h-16 w-16 text-neutral-300" />}
          title="Nenhum anúncio encontrado"
          description="Tente ajustar os filtros ou publique o primeiro anúncio."
          action={
            <Button onClick={() => navigate('/marketplace/new')}>
              <Plus className="h-4 w-4" />
              Publicar Anúncio
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={() => navigate(`/marketplace/${listing.id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-neutral-600">
                {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <AzoresMap
          pins={mapPins}
          height="500px"
          onPinClick={(id) => navigate(`/marketplace/${id}`)}
          showClustering
          colorBy="status"
        />
      )}

      {/* Floating action button for mobile */}
      <button
        type="button"
        onClick={() => navigate('/marketplace/new')}
        className="fixed bottom-20 right-4 lg:hidden z-30 flex items-center justify-center h-14 w-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-colors"
        aria-label="Publicar Anúncio"
      >
        <Plus className="h-6 w-6" />
      </button>
    </AnimatedPage>
  );
}
