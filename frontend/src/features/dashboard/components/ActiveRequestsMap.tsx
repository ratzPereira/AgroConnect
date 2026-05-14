import { MapContainer, TileLayer } from 'react-leaflet';
import { cn } from '@/utils/cn';
import 'leaflet/dist/leaflet.css';

interface ActiveRequestsMapProps {
  readonly activeCount: number;
  readonly className?: string;
}

export function ActiveRequestsMap({ activeCount, className }: ActiveRequestsMapProps) {
  return (
    <div className={cn('relative h-[300px] md:h-[60vh] rounded-xl overflow-hidden border border-neutral-200', className)}>
      <MapContainer
        center={[38.7, -27.2]}
        zoom={8}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
      </MapContainer>
      <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/90 backdrop-blur-sm px-3 py-2 shadow-card">
        <p className="text-xs font-medium text-neutral-500">Pedidos ativos</p>
        <p className="text-lg font-bold text-primary-600">{activeCount}</p>
      </div>
    </div>
  );
}
