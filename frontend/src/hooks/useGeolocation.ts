import { useState, useEffect } from 'react';
import { haversineDistance } from '@/utils/haversine';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(enabled = true) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      setState((s) => ({ ...s, loading: false, error: 'Geolocalização não disponível' }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Permissão de localização negada',
          2: 'Posição indisponível',
          3: 'Tempo esgotado',
        };
        setState((s) => ({
          ...s,
          loading: false,
          error: messages[err.code] || 'Erro de geolocalização',
        }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return state;
}

export function useDistanceTo(targetLat: number, targetLon: number, enabled = true) {
  const geo = useGeolocation(enabled);
  const distance =
    geo.latitude != null && geo.longitude != null
      ? haversineDistance(geo.latitude, geo.longitude, targetLat, targetLon)
      : null;

  return { ...geo, distance };
}
