import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckinMap } from '../CheckinMap';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ position }: { position: [number, number] }) => (
    <div data-testid="marker" data-lat={position[0]} data-lng={position[1]} />
  ),
  Circle: () => <div data-testid="circle" />,
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
    latLngBounds: vi.fn(() => ({
      pad: vi.fn(() => [[38.64, -27.23], [38.66, -27.21]]),
    })),
  },
  divIcon: vi.fn(() => ({})),
  latLngBounds: vi.fn(() => ({
    pad: vi.fn(() => [[38.64, -27.23], [38.66, -27.21]]),
  })),
}));

vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: vi.fn(() => ({ latitude: 38.66, longitude: -27.20 })),
}));

describe('CheckinMap', () => {
  const defaultProps = {
    targetLat: 38.65,
    targetLon: -27.22,
  };

  it('renders map container', () => {
    render(<CheckinMap {...defaultProps} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders markers for target location and user location', () => {
    render(<CheckinMap {...defaultProps} />);
    const markers = screen.getAllByTestId('marker');
    // Target marker + user location marker
    expect(markers.length).toBeGreaterThanOrEqual(2);
  });

  it('renders checkin marker when checked in', () => {
    render(
      <CheckinMap
        {...defaultProps}
        checkedIn={true}
        checkinLat={38.655}
        checkinLon={-27.218}
      />,
    );
    const markers = screen.getAllByTestId('marker');
    // Target marker + checkin marker
    expect(markers.length).toBeGreaterThanOrEqual(2);
  });

  it('renders radius circle around target', () => {
    render(<CheckinMap {...defaultProps} />);
    expect(screen.getByTestId('circle')).toBeInTheDocument();
  });
});
