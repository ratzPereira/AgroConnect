import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AzoresMap } from '../AzoresMap';
import type { RequestPin } from '@/types/pin';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  Circle: () => <div data-testid="circle" />,
}));

vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="cluster-group">{children}</div>
  ),
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
  },
  divIcon: vi.fn(() => ({})),
}));

const mockPins: RequestPin[] = [
  {
    id: 1,
    latitude: 38.65,
    longitude: -27.22,
    status: 'PUBLISHED',
    title: 'Lavoura de terreno',
    categoryName: 'Preparação de Solo',
    urgency: 'MEDIUM',
    island: 'Terceira',
  },
  {
    id: 2,
    latitude: 37.74,
    longitude: -25.67,
    status: 'WITH_PROPOSALS',
    title: 'Limpeza de mato',
    categoryName: 'Limpeza',
    urgency: 'HIGH',
    island: 'São Miguel',
  },
];

describe('AzoresMap', () => {
  function renderMap(pins = mockPins, extraProps = {}) {
    return render(
      <MemoryRouter>
        <AzoresMap pins={pins} {...extraProps} />
      </MemoryRouter>,
    );
  }

  it('renders map container', () => {
    renderMap();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders markers when pins are provided', () => {
    renderMap();
    const markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(2);
  });

  it('renders no markers when pins array is empty', () => {
    renderMap([]);
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
  });

  it('renders provider location marker and circle when provided', () => {
    renderMap(mockPins, {
      providerLocation: { latitude: 38.70, longitude: -27.10, radiusKm: 50 },
    });
    // 2 pin markers + 1 provider marker
    const markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(3);
    expect(screen.getByTestId('circle')).toBeInTheDocument();
  });

  it('renders marker cluster group when showClustering is true (default)', () => {
    renderMap();
    expect(screen.getByTestId('cluster-group')).toBeInTheDocument();
  });

  it('renders popup content with pin details', () => {
    renderMap();
    expect(screen.getByText('Lavoura de terreno')).toBeInTheDocument();
    expect(screen.getByText('Preparação de Solo')).toBeInTheDocument();
    expect(screen.getByText('Terceira')).toBeInTheDocument();
  });
});
