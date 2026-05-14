import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation } from '@/hooks/useGeolocation';

interface CheckinMapProps {
  readonly targetLat: number;
  readonly targetLon: number;
  readonly checkedIn?: boolean;
  readonly checkinLat?: number;
  readonly checkinLon?: number;
}

const JOB_SITE_ICON = L.divIcon({
  className: '',
  html: `<svg viewBox="0 0 28 36" width="24" height="32"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#ef4444" stroke="white" stroke-width="1.5"/><circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/></svg>`,
  iconSize: [24, 32],
  iconAnchor: [12, 32],
});

const USER_ICON = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 0 rgba(59,130,246,0.5);animation:pulse-dot 2s infinite"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const CHECKIN_ICON = L.divIcon({
  className: '',
  html: `<svg viewBox="0 0 28 36" width="24" height="32"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#22c55e" stroke="white" stroke-width="1.5"/><circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/></svg>`,
  iconSize: [24, 32],
  iconAnchor: [12, 32],
});

export function CheckinMap({ targetLat, targetLon, checkedIn, checkinLat, checkinLon }: CheckinMapProps) {
  const geo = useGeolocation(!checkedIn);

  const userLat = checkedIn && checkinLat ? checkinLat : geo.latitude;
  const userLon = checkedIn && checkinLon ? checkinLon : geo.longitude;

  const bounds = userLat && userLon
    ? L.latLngBounds([[targetLat, targetLon], [userLat, userLon]]).pad(0.3)
    : L.latLngBounds([[targetLat - 0.005, targetLon - 0.005], [targetLat + 0.005, targetLon + 0.005]]);

  return (
    <div className="rounded-lg overflow-hidden border border-neutral-200 h-[200px]">
      <MapContainer
        bounds={bounds}
        style={{ height: '100%', width: '100%' }}
        dragging={false}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <Marker position={[targetLat, targetLon]} icon={JOB_SITE_ICON} />
        <Circle
          center={[targetLat, targetLon]}
          radius={500}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.06,
            weight: 1,
            dashArray: '6 4',
          }}
        />
        {userLat && userLon && (
          <Marker
            position={[userLat, userLon]}
            icon={checkedIn ? CHECKIN_ICON : USER_ICON}
          />
        )}
      </MapContainer>
    </div>
  );
}
