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
  const totalElements = data?.totalElements ?? 0;

  const mapPins: RequestPin[] = useMemo(
    () =>
      listings
        .filter((l) => l.latitude && l.longitude)
        .map((l) => ({
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
      () => { /* Geolocation denied or unavailable */ },
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900">
            Marketplace
          </h1>
          {!isLoading && totalElements > 0 && (
            <p className="text-sm text-neutral-500" style={{ marginTop: 2 }}>
              {totalElements} anúncio{totalElements !== 1 ? 's' : ''} encontrado{totalElements !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button onClick={() => navigate('/marketplace/new')} size="sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Publicar Anúncio</span>
        </Button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Search
            className="text-neutral-400"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16 }}
          />
          <input
            name="search"
            type="text"
            defaultValue={searchQuery}
            placeholder="Pesquisar animais, plantas, equipamentos..."
            className="placeholder:text-neutral-400"
            style={{
              display: 'block',
              width: '100%',
              borderRadius: 12,
              border: '1px solid #e5e5e5',
              backgroundColor: '#fafaf9',
              paddingLeft: 40,
              paddingRight: 16,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>
      </form>

      {/* Category pills */}
      <div style={{ marginBottom: 20 }}>
        <CategoryFilter
          selected={category as ListingCategory | null}
          onSelect={(cat) => updateParams({ category: cat ?? '' })}
        />
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <select
          value={islandParam}
          onChange={(e) => updateParams({ island: e.target.value })}
          style={{
            borderRadius: 12,
            border: '1px solid #e5e5e5',
            backgroundColor: 'white',
            padding: '8px 12px',
            fontSize: 14,
            outline: 'none',
          }}
        >
          {ISLAND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Input
            type="number"
            placeholder="Min"
            className="w-20 rounded-xl"
            value={minPriceParam}
            onChange={(e) => updateParams({ minPrice: e.target.value })}
          />
          <span className="text-neutral-300 text-sm">—</span>
          <Input
            type="number"
            placeholder="Max"
            className="w-20 rounded-xl"
            value={maxPriceParam}
            onChange={(e) => updateParams({ maxPrice: e.target.value })}
          />
          <span className="text-xs text-neutral-400 font-medium">EUR</span>
        </div>

        <button
          type="button"
          onClick={handleNearMe}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200',
            nearMe
              ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 shadow-sm'
              : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:ring-neutral-300 hover:bg-neutral-50',
          )}
          style={{ padding: '8px 14px', borderRadius: 12 }}
        >
          <MapPin style={{ width: 16, height: 16 }} />
          Perto de mim
        </button>

        {/* View toggle */}
        <div
          className="bg-neutral-100"
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2, borderRadius: 12, padding: 2 }}
        >
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'transition-all duration-150',
              viewMode === 'grid'
                ? 'bg-white shadow-sm text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-600',
            )}
            style={{ padding: 8, borderRadius: 8 }}
            aria-label="Vista em grelha"
          >
            <LayoutGrid style={{ width: 16, height: 16 }} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={cn(
              'transition-all duration-150',
              viewMode === 'map'
                ? 'bg-white shadow-sm text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-600',
            )}
            style={{ padding: 8, borderRadius: 8 }}
            aria-label="Vista no mapa"
          >
            <Map style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 16,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 16, border: '1px solid #e5e5e5', backgroundColor: 'white', overflow: 'hidden' }}>
              <div style={{ height: 192 }}>
                <Skeleton className="w-full" style={{ height: '100%' }} />
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Skeleton.Line className="h-4 w-4/5" />
                <Skeleton.Line className="h-6 w-24" />
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 16,
            }}
          >
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={() => navigate(`/marketplace/${listing.id}`)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 40 }}>
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-neutral-600">
                Página {page + 1} de {totalPages}
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

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => navigate('/marketplace/new')}
        className="lg:hidden bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all"
        style={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 56,
          width: 56,
          borderRadius: '50%',
          boxShadow: '0 4px 14px rgba(45, 138, 45, 0.25)',
        }}
        aria-label="Publicar Anúncio"
      >
        <Plus style={{ width: 24, height: 24 }} />
      </button>
    </AnimatedPage>
  );
}
