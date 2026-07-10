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

  describe('Usar a minha localização', () => {
    function mockGeolocation(impl: (success: PositionCallback, error?: PositionErrorCallback) => void) {
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition: vi.fn(impl) },
      });
    }

    it('renders the use-my-location button', () => {
      render(<LocationPicker {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Usar a minha localização/ })).toBeInTheDocument();
    });

    it('sets the pin (rounded to 4 decimals) when inside the Azores', () => {
      const onChange = vi.fn();
      mockGeolocation((success) =>
        success({ coords: { latitude: 38.66423349, longitude: -27.26161111 } } as GeolocationPosition),
      );
      render(<LocationPicker {...defaultProps} onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Usar a minha localização/ }));
      expect(onChange).toHaveBeenCalledWith(38.6642, -27.2616);
    });

    it('warns instead of setting the pin when outside the Azores', () => {
      const onChange = vi.fn();
      mockGeolocation((success) =>
        success({ coords: { latitude: 38.7223, longitude: -9.1393 } } as GeolocationPosition), // Lisboa
      );
      render(<LocationPicker {...defaultProps} onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Usar a minha localização/ }));
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText(/fora dos Açores/)).toBeInTheDocument();
    });

    it('shows an error message when permission is denied', () => {
      const onChange = vi.fn();
      mockGeolocation((_success, error) =>
        error?.({ code: 1, message: 'denied' } as GeolocationPositionError),
      );
      render(<LocationPicker {...defaultProps} onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: /Usar a minha localização/ }));
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText(/Verifique as permissões/)).toBeInTheDocument();
    });
  });
});
