import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnimatedCounter } from '../useAnimatedCounter';

vi.mock('framer-motion', () => ({ useReducedMotion: vi.fn(() => false) }));

describe('useAnimatedCounter', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('should show target immediately on first render', () => {
    const { result } = renderHook(() => useAnimatedCounter(100));
    expect(result.current).toBe(100);
  });

  it('should return target immediately when reduced motion is preferred', async () => {
    const { useReducedMotion } = await import('framer-motion');
    vi.mocked(useReducedMotion).mockReturnValue(true);
    const { result } = renderHook(() => useAnimatedCounter(42));
    expect(result.current).toBe(42);
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  it('should respect decimals option', async () => {
    const { useReducedMotion } = await import('framer-motion');
    vi.mocked(useReducedMotion).mockReturnValue(true);
    const { result } = renderHook(() => useAnimatedCounter(3.14159, { decimals: 2 }));
    expect(result.current).toBe(3.14);
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });
});
