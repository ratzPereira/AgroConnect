import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
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

export function LocationPicker({ lat, lng, onChange, center }: LocationPickerProps) {
  const mapCenter = center ?? DEFAULT_CENTER;

  const markerPosition = useMemo(() => {
    if (lat !== null && lng !== null) {
      return [lat, lng] as [number, number];
    }
    return null;
  }, [lat, lng]);

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
      </div>
      {lat !== null && lng !== null && (
        <div className="flex gap-4 text-sm text-neutral-600">
          <span>Lat: <strong>{lat}</strong></span>
          <span>Lng: <strong>{lng}</strong></span>
        </div>
      )}
    </div>
  );
}
