import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import type { RequestPin } from '@/types/pin';
import { cn } from '@/utils/cn';
import './AzoresMap.css';

interface AzoresMapProps {
  pins: RequestPin[];
  highlightIsland?: string;
  providerLocation?: { latitude: number; longitude: number; radiusKm: number };
  height?: string;
  onPinClick?: (id: number) => void;
  selectedId?: number;
  showClustering?: boolean;
  colorBy?: 'status' | 'urgency';
}

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: '#10b981',
  WITH_PROPOSALS: '#3b82f6',
  AWARDED: '#f59e0b',
  IN_PROGRESS: '#8b5cf6',
  AWAITING_CONFIRMATION: '#f97316',
  COMPLETED: '#9ca3af',
  DISPUTED: '#ef4444',
};

const URGENCY_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

const AZORES_CENTER: L.LatLngExpression = [38.65, -28.0];
const AZORES_ZOOM = 7;

function createPinIcon(
  color: string,
  isDimmed: boolean,
  isSelected: boolean,
): L.DivIcon {
  const classes = [
    'azores-map-pin',
    isDimmed && 'dimmed',
    isSelected && 'selected',
  ]
    .filter(Boolean)
    .join(' ');

  return L.divIcon({
    className: classes,
    html: `<svg viewBox="0 0 28 36"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/></svg>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

function createProviderDot(): L.DivIcon {
  return L.divIcon({
    className: 'provider-dot',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export function AzoresMap({
  pins,
  highlightIsland,
  providerLocation,
  height = '400px',
  onPinClick,
  selectedId,
  showClustering = true,
  colorBy = 'status',
}: AzoresMapProps) {
  const navigate = useNavigate();

  function getColor(pin: RequestPin): string {
    if (colorBy === 'urgency') {
      return URGENCY_COLORS[pin.urgency] || '#9ca3af';
    }
    return STATUS_COLORS[pin.status] || '#9ca3af';
  }

  function handlePinClick(id: number) {
    if (onPinClick) {
      onPinClick(id);
    } else {
      navigate(`/requests/${id}`);
    }
  }

  const markers = pins.map((pin) => {
    const isDimmed = highlightIsland ? pin.island !== highlightIsland : false;
    const isSelected = selectedId === pin.id;
    const color = getColor(pin);
    const icon = createPinIcon(color, isDimmed, isSelected);

    return (
      <Marker
        key={pin.id}
        position={[pin.latitude, pin.longitude]}
        icon={icon}
        eventHandlers={{ click: () => handlePinClick(pin.id) }}
      >
        <Popup>
          <div className="min-w-[180px]">
            <p className="text-xs font-medium text-neutral-500">{pin.categoryName}</p>
            <p className="font-semibold text-sm text-neutral-900 mt-0.5">{pin.title}</p>
            <p className="text-xs text-neutral-500 mt-1">{pin.island}</p>
            <button
              onClick={() => handlePinClick(pin.id)}
              className="text-xs text-primary-600 font-medium mt-2 hover:underline"
            >
              Ver detalhes
            </button>
          </div>
        </Popup>
      </Marker>
    );
  });

  const content = showClustering ? (
    <MarkerClusterGroup chunkedLoading>{markers}</MarkerClusterGroup>
  ) : (
    <>{markers}</>
  );

  return (
    <div className={cn('rounded-xl overflow-hidden border border-neutral-200')} style={{ height }}>
      <MapContainer
        center={AZORES_CENTER}
        zoom={AZORES_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {content}
        {providerLocation && (
          <>
            <Marker
              position={[providerLocation.latitude, providerLocation.longitude]}
              icon={createProviderDot()}
            />
            <Circle
              center={[providerLocation.latitude, providerLocation.longitude]}
              radius={providerLocation.radiusKm * 1000}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.08,
                weight: 1,
                dashArray: '6 4',
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
