import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Custom SVG marker icon (avoids Leaflet's broken PNG imports with Vite)
const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="42" viewBox="0 0 28 42">
  <defs><filter id="s" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/></filter></defs>
  <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 28 14 28s14-17.5 14-28C28 6.268 21.732 0 14 0z" fill="#16a34a" filter="url(#s)"/>
  <circle cx="14" cy="14" r="6" fill="white"/>
</svg>`;

const markerIcon = L.divIcon({
  html: pinSvg,
  className: '',
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -42],
});

interface LocationPickerProps {
  readonly lat: number | null;
  readonly lng: number | null;
  readonly onChange: (lat: number, lng: number) => void;
  readonly center?: { lat: number; lng: number; zoom: number };
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(
        Math.round(e.latlng.lat * 10000) / 10000,
        Math.round(e.latlng.lng * 10000) / 10000,
      );
    },
  });
  return null;
}

function MapCenterUpdater({ center }: { center: { lat: number; lng: number; zoom: number } }) {
  const map = useMap();
  const prevCenter = useRef(center);

  useEffect(() => {
    if (
      prevCenter.current.lat !== center.lat ||
      prevCenter.current.lng !== center.lng ||
      prevCenter.current.zoom !== center.zoom
    ) {
      map.flyTo([center.lat, center.lng], center.zoom, { duration: 0.8 });
      prevCenter.current = center;
    }
  }, [map, center]);

  return null;
}

const DEFAULT_CENTER = { lat: 38.7, lng: -27.2, zoom: 6 };

// Mirrors the backend DTO validation bounds — coordinates outside the Azores
// would be rejected on submit, so we warn instead of dropping the pin.
const AZORES_BOUNDS = { latMin: 36.9, latMax: 39.8, lngMin: -31.3, lngMax: -24.7 };

interface FlyTarget {
  lat: number;
  lng: number;
  zoom: number;
  seq: number;
}

function FlyTo({ target }: { readonly target: FlyTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.8 });
    }
  }, [map, target]);
  return null;
}

export function LocationPicker({ lat, lng, onChange, center }: LocationPickerProps) {
  const mapCenter = center ?? DEFAULT_CENTER;
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);

  const markerPosition = useMemo(() => {
    if (lat !== null && lng !== null) {
      return [lat, lng] as [number, number];
    }
    return null;
  }, [lat, lng]);

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setGeoError('O seu dispositivo não suporta geolocalização.');
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const myLat = Math.round(pos.coords.latitude * 10000) / 10000;
        const myLng = Math.round(pos.coords.longitude * 10000) / 10000;
        if (
          myLat < AZORES_BOUNDS.latMin || myLat > AZORES_BOUNDS.latMax ||
          myLng < AZORES_BOUNDS.lngMin || myLng > AZORES_BOUNDS.lngMax
        ) {
          setGeoError('A sua localização atual está fora dos Açores — marque o local no mapa.');
          return;
        }
        onChange(myLat, myLng);
        setFlyTarget({ lat: myLat, lng: myLng, zoom: 15, seq: Date.now() });
      },
      () => {
        setLocating(false);
        setGeoError('Não foi possível obter a localização. Verifique as permissões do browser.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-2">
      <div
        className="relative rounded-xl overflow-hidden border border-neutral-200"
        style={{ height: 350 }}
      >
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={mapCenter.zoom}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <ClickHandler onChange={onChange} />
          <MapCenterUpdater center={mapCenter} />
          <FlyTo target={flyTarget} />
          {markerPosition && <Marker position={markerPosition} icon={markerIcon} />}
        </MapContainer>
        <div
          className="absolute top-3 left-3 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-2 shadow-sm"
          style={{ zIndex: 1000 }}
        >
          <p className="text-xs text-neutral-500">
            Clique no mapa para marcar a localização
          </p>
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 backdrop-blur-sm px-3 py-2 text-xs font-medium text-primary-700 shadow-sm border border-neutral-200 hover:bg-primary-50 transition-colors disabled:opacity-60"
          style={{ zIndex: 1000 }}
        >
          {locating
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <LocateFixed className="h-3.5 w-3.5" />}
          {locating ? 'A localizar…' : 'Usar a minha localização'}
        </button>
      </div>
      {geoError && (
        <p className="text-xs text-warning-700 bg-warning-50 border border-warning-200 rounded-lg px-3 py-2">
          {geoError}
        </p>
      )}
      {lat !== null && lng !== null && (
        <div className="flex gap-4 text-sm text-neutral-600">
          <span>Lat: <strong>{lat}</strong></span>
          <span>Lng: <strong>{lng}</strong></span>
        </div>
      )}
    </div>
  );
}
