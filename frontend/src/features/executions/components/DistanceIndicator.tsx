import { useDistanceTo } from '@/hooks/useGeolocation';
import { formatDistance } from '@/utils/haversine';
import { MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface DistanceIndicatorProps {
  readonly targetLat: number;
  readonly targetLon: number;
}

const MAX_CHECKIN_DISTANCE = 500;

export function DistanceIndicator({ targetLat, targetLon }: DistanceIndicatorProps) {
  const { distance, loading, error } = useDistanceTo(targetLat, targetLon);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        A obter localização...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-danger-600 py-2">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }

  if (distance == null) return null;

  const isClose = distance <= MAX_CHECKIN_DISTANCE;

  return (
    <div
      className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg ${
        isClose
          ? 'bg-leaf-50 text-leaf-700'
          : 'bg-warning-50 text-warning-700'
      }`}
    >
      {isClose ? (
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
      ) : (
        <MapPin className="h-4 w-4 flex-shrink-0" />
      )}
      <span>
        Está a ~{formatDistance(distance)} do local
        {!isClose && ' — deve estar a menos de 500m'}
      </span>
    </div>
  );
}
