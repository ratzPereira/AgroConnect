import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationPicker } from '../LocationPicker';

vi.mock('react-leaflet', () => {
  const onChangeRef = { current: null as ((lat: number, lng: number) => void) | null };

  return {
    MapContainer: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="map-container" className={className}>{children}</div>
    ),
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ position }: { position: [number, number] }) => (
      <div data-testid="marker" data-lat={position[0]} data-lng={position[1]} />
    ),
    useMapEvents: (handlers: { click: (e: { latlng: { lat: number; lng: number } }) => void }) => {
      onChangeRef.current = (lat, lng) => handlers.click({ latlng: { lat, lng } });
      return null;
    },
    useMap: () => ({
      flyTo: vi.fn(),
    }),
    __onChangeRef: onChangeRef,
  };
});

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
  },
  divIcon: vi.fn(() => ({})),
}));

describe('LocationPicker', () => {
  const defaultProps = {
    lat: null as number | null,
    lng: null as number | null,
    onChange: vi.fn(),
  };

  it('renders map container', () => {
    render(<LocationPicker {...defaultProps} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders with provided coordinates and displays them', () => {
    render(<LocationPicker {...defaultProps} lat={38.6545} lng={-27.2167} />);
    expect(screen.getByTestId('marker')).toBeInTheDocument();
    expect(screen.getByText('38.6545')).toBeInTheDocument();
    expect(screen.getByText('-27.2167')).toBeInTheDocument();
  });

  it('does not render marker or coordinates when lat/lng are null', () => {
    render(<LocationPicker {...defaultProps} />);
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
    expect(screen.queryByText(/Lat:/)).not.toBeInTheDocument();
  });

  it('shows instruction text in Portuguese', () => {
    render(<LocationPicker {...defaultProps} />);
    expect(screen.getByText('Clique no mapa para marcar a localização')).toBeInTheDocument();
  });
});
