import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DistanceIndicator } from '../DistanceIndicator';

const mockUseDistanceTo = vi.fn();

vi.mock('@/hooks/useGeolocation', () => ({
  useDistanceTo: (...args: unknown[]) => mockUseDistanceTo(...args),
}));

vi.mock('@/utils/haversine', () => ({
  formatDistance: vi.fn((m: number) =>
    m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`,
  ),
}));

describe('DistanceIndicator', () => {
  const defaultProps = { targetLat: 38.65, targetLon: -27.22 };

  it('shows loading state', () => {
    mockUseDistanceTo.mockReturnValue({ distance: null, loading: true, error: null });
    render(<DistanceIndicator {...defaultProps} />);
    expect(screen.getByText(/a obter localiza\u00e7\u00e3o/i)).toBeInTheDocument();
  });

  it('shows error message', () => {
    mockUseDistanceTo.mockReturnValue({
      distance: null,
      loading: false,
      error: 'Localiza\u00e7\u00e3o indispon\u00edvel',
    });
    render(<DistanceIndicator {...defaultProps} />);
    expect(screen.getByText('Localiza\u00e7\u00e3o indispon\u00edvel')).toBeInTheDocument();
  });

  it('returns null when distance is null and not loading or errored', () => {
    mockUseDistanceTo.mockReturnValue({ distance: null, loading: false, error: null });
    const { container } = render(<DistanceIndicator {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows green indicator when within 500m', () => {
    mockUseDistanceTo.mockReturnValue({ distance: 200, loading: false, error: null });
    render(<DistanceIndicator {...defaultProps} />);
    const indicator = screen.getByText(/est\u00e1 a ~200m do local/i);
    expect(indicator).toBeInTheDocument();
    // Should NOT show the "must be within 500m" warning
    expect(screen.queryByText(/deve estar a menos de 500m/i)).not.toBeInTheDocument();
  });

  it('shows warning when beyond 500m', () => {
    mockUseDistanceTo.mockReturnValue({ distance: 1200, loading: false, error: null });
    render(<DistanceIndicator {...defaultProps} />);
    expect(screen.getByText(/est\u00e1 a ~1\.2km do local/i)).toBeInTheDocument();
    expect(screen.getByText(/deve estar a menos de 500m/i)).toBeInTheDocument();
  });
});
