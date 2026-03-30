import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RequestMapView } from '../RequestMapView';

const mockPins = [
  { id: 1, latitude: 38.65, longitude: -27.22, status: 'PUBLISHED' as const, title: 'Lavoura A', categoryName: 'Solo', urgency: 'MEDIUM' as const, island: 'Terceira' },
  { id: 2, latitude: 38.70, longitude: -27.10, status: 'WITH_PROPOSALS' as const, title: 'Limpeza B', categoryName: 'Limpeza', urgency: 'HIGH' as const, island: 'São Miguel' },
];

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: mockPins,
    isLoading: false,
  })),
}));

vi.mock('@/api/pins', () => ({
  getRequestPins: vi.fn(),
}));

vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: vi.fn(() => ({ latitude: null, longitude: null })),
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Circle: () => <div data-testid="circle" />,
}));

vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="cluster">{children}</div>,
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
    latLngBounds: vi.fn(() => ({ pad: vi.fn() })),
  },
  divIcon: vi.fn(() => ({})),
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: Object.assign(() => <div />, {
    Rect: ({ className }: { className?: string }) => <div data-testid="skeleton-rect" className={className} />,
  }),
}));

describe('RequestMapView', () => {
  const defaultFilters = { search: '', urgency: '', island: '' };

  function renderComponent(filters = defaultFilters) {
    return render(
      <MemoryRouter>
        <RequestMapView filters={filters} />
      </MemoryRouter>,
    );
  }

  it('renders map container', () => {
    renderComponent();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders markers for requests', () => {
    renderComponent();
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBeGreaterThanOrEqual(2);
  });
});
