import { useQuery } from '@tanstack/react-query';
import { getRequestPins } from '@/api/pins';
import { AzoresMap } from '@/components/AzoresMap';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { FilterState } from './RequestFilters';
import { Skeleton } from '@/components/ui/Skeleton';

interface RequestMapViewProps {
  readonly filters: FilterState;
}

export function RequestMapView({ filters }: RequestMapViewProps) {
  const geo = useGeolocation(true);
  const { data: pins, isLoading } = useQuery({
    queryKey: ['request-pins'],
    queryFn: getRequestPins,
    refetchOnMount: 'always',
  });

  if (isLoading) {
    return <Skeleton.Rect className="h-[500px]" />;
  }

  const filtered = (pins ?? []).filter((pin) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!pin.title.toLowerCase().includes(q) && !pin.categoryName.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filters.urgency && pin.urgency !== filters.urgency) return false;
    if (filters.island && pin.island !== filters.island) return false;
    return true;
  });

  const providerLocation = geo.latitude && geo.longitude
    ? { latitude: geo.latitude, longitude: geo.longitude, radiusKm: 50 }
    : undefined;

  return (
    <AzoresMap
      pins={filtered}
      providerLocation={providerLocation}
      height="500px"
      colorBy="urgency"
      highlightIsland={filters.island || undefined}
    />
  );
}
