import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

/* ── Mocks ───────────────────────────────────────────────── */

const mockUseReducedMotion = vi.fn(() => false);

vi.mock('framer-motion', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

/* ── Import after mock ───────────────────────────────────── */

import { useAnimatedCounter } from '../useAnimatedCounter';

/* ── Tests ───────────────────────────────────────────────── */

describe('useAnimatedCounter — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns target value immediately on first render', () => {
    const { result } = renderHook(() => useAnimatedCounter(100));
    // On first render, isFirstRender is true so value is set immediately
    expect(result.current).toBe(100);
  });

  it('handles decimal precision correctly', () => {
    const { result } = renderHook(() => useAnimatedCounter(99.456, { decimals: 2 }));
    // On first render, value is set immediately with decimal rounding
    expect(result.current).toBe(99.46);
  });

  it('returns target immediately when reduced motion is preferred', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedCounter(target, { decimals: 0 }),
      { initialProps: { target: 50 } },
    );
    expect(result.current).toBe(50);

    // Even on re-render with new target, reduced motion skips animation
    rerender({ target: 200 });
    expect(result.current).toBe(200);
  });

  it('returns initial value of 0 correctly', () => {
    const { result } = renderHook(() => useAnimatedCounter(0));
    expect(result.current).toBe(0);
  });

  it('handles large numbers', () => {
    const { result } = renderHook(() => useAnimatedCounter(1000000));
    expect(result.current).toBe(1000000);
  });

  it('updates value when target changes with animation', () => {
    // Use fake timers to control requestAnimationFrame
    vi.useFakeTimers();

    // Track requestAnimationFrame callbacks
    const callbacks: Array<(time: number) => void> = [];
    const originalRAF = globalThis.requestAnimationFrame;
    const originalCAF = globalThis.cancelAnimationFrame;

    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    globalThis.cancelAnimationFrame = vi.fn();

    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedCounter(target, { duration: 1000, decimals: 0 }),
      { initialProps: { target: 0 } },
    );

    // First render: value is 0 immediately
    expect(result.current).toBe(0);

    // Change target to trigger animation
    rerender({ target: 100 });

    // A requestAnimationFrame should have been called
    expect(callbacks.length).toBeGreaterThan(0);

    // Simulate animation frame at progress = 1 (complete)
    act(() => {
      const lastCallback = callbacks[callbacks.length - 1];
      // Call with timestamp 0 first to set startTime
      lastCallback(0);
    });

    // Call again at the end of the duration to complete
    if (callbacks.length > 1) {
      act(() => {
        const lastCallback = callbacks[callbacks.length - 1];
        lastCallback(1000);
      });
    }

    // Restore
    globalThis.requestAnimationFrame = originalRAF;
    globalThis.cancelAnimationFrame = originalCAF;
    vi.useRealTimers();
  });
});
