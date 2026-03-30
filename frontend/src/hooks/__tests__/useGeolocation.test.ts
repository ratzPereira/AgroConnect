import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

vi.mock('@/utils/haversine', () => ({
  haversineDistance: vi.fn(() => 5000),
}));

const mockWatchPosition = vi.fn();
const mockClearWatch = vi.fn();

describe('useGeolocation', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { watchPosition: mockWatchPosition, clearWatch: mockClearWatch },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns loading state initially', async () => {
    mockWatchPosition.mockReturnValue(1);
    const { useGeolocation } = await import('../useGeolocation');
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.loading).toBe(true);
    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets position on success', async () => {
    mockWatchPosition.mockImplementation((success) => {
      success({ coords: { latitude: 38.65, longitude: -27.22, accuracy: 10 } });
      return 1;
    });
    const { useGeolocation } = await import('../useGeolocation');
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.loading).toBe(false);
    expect(result.current.latitude).toBe(38.65);
    expect(result.current.longitude).toBe(-27.22);
    expect(result.current.accuracy).toBe(10);
    expect(result.current.error).toBeNull();
  });

  it('sets error on permission denied (code 1)', async () => {
    mockWatchPosition.mockImplementation((_, error) => {
      error({ code: 1 });
      return 1;
    });
    const { useGeolocation } = await import('../useGeolocation');
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Permissão de localização negada');
  });

  it('sets error on position unavailable (code 2)', async () => {
    mockWatchPosition.mockImplementation((_, error) => {
      error({ code: 2 });
      return 1;
    });
    const { useGeolocation } = await import('../useGeolocation');
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Posição indisponível');
  });

  it('sets error on timeout (code 3)', async () => {
    mockWatchPosition.mockImplementation((_, error) => {
      error({ code: 3 });
      return 1;
    });
    const { useGeolocation } = await import('../useGeolocation');
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Tempo esgotado');
  });

  it('sets error when geolocation is not available', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const { useGeolocation } = await import('../useGeolocation');
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Geolocalização não disponível');
  });

  it('does not watch position when disabled', async () => {
    mockWatchPosition.mockReturnValue(1);
    const { useGeolocation } = await import('../useGeolocation');
    const { result } = renderHook(() => useGeolocation(false));

    expect(mockWatchPosition).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Geolocalização não disponível');
  });

  it('clears watch on unmount', async () => {
    const watchId = 42;
    mockWatchPosition.mockReturnValue(watchId);
    const { useGeolocation } = await import('../useGeolocation');
    const { unmount } = renderHook(() => useGeolocation());

    unmount();
    expect(mockClearWatch).toHaveBeenCalledWith(watchId);
  });
});

describe('useDistanceTo', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { watchPosition: mockWatchPosition, clearWatch: mockClearWatch },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('computes distance when position is available', async () => {
    mockWatchPosition.mockImplementation((success) => {
      success({ coords: { latitude: 38.65, longitude: -27.22, accuracy: 10 } });
      return 1;
    });
    const { haversineDistance } = await import('@/utils/haversine');
    vi.mocked(haversineDistance).mockReturnValue(5000);

    const { useDistanceTo } = await import('../useGeolocation');
    const { result } = renderHook(() => useDistanceTo(38.70, -27.20));

    expect(result.current.distance).toBe(5000);
    expect(result.current.latitude).toBe(38.65);
    expect(result.current.longitude).toBe(-27.22);
    expect(haversineDistance).toHaveBeenCalledWith(38.65, -27.22, 38.70, -27.20);
  });

  it('returns null distance when position is not available', async () => {
    mockWatchPosition.mockReturnValue(1);
    const { useDistanceTo } = await import('../useGeolocation');
    const { result } = renderHook(() => useDistanceTo(38.70, -27.20, false));

    expect(result.current.distance).toBeNull();
  });
});
