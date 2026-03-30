import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';

let mockReducedMotion = false;

vi.mock('framer-motion', () => ({
  useReducedMotion: () => mockReducedMotion,
}));

import { useMotionConfig } from '../useMotionConfig';

describe('useMotionConfig', () => {
  afterEach(() => {
    mockReducedMotion = false;
    cleanup();
  });

  it('returns shouldAnimate=true when reduced motion is false', () => {
    mockReducedMotion = false;
    const { result } = renderHook(() => useMotionConfig());
    expect(result.current.shouldAnimate).toBe(true);
  });

  it('returns shouldAnimate=false when reduced motion is true', () => {
    mockReducedMotion = true;
    const { result } = renderHook(() => useMotionConfig());
    expect(result.current.shouldAnimate).toBe(false);
  });

  it('pageVariants have opacity animation when shouldAnimate is true', () => {
    mockReducedMotion = false;
    const { result } = renderHook(() => useMotionConfig());
    const { pageVariants } = result.current;

    expect(pageVariants.initial).toEqual({ opacity: 0, y: 8 });
    expect(pageVariants.animate).toEqual({ opacity: 1, y: 0 });
    expect(pageVariants.exit).toEqual({ opacity: 0 });
  });

  it('pageVariants have static opacity=1 when reduced motion is preferred', () => {
    mockReducedMotion = true;
    const { result } = renderHook(() => useMotionConfig());
    const { pageVariants } = result.current;

    expect(pageVariants.initial).toEqual({ opacity: 1 });
    expect(pageVariants.animate).toEqual({ opacity: 1 });
    expect(pageVariants.exit).toEqual({ opacity: 1 });
  });

  it('pageTransition has zero duration when reduced motion is preferred', () => {
    mockReducedMotion = true;
    const { result } = renderHook(() => useMotionConfig());
    const { pageTransition } = result.current;

    expect(pageTransition).toEqual(
      expect.objectContaining({ duration: 0 }),
    );
  });

  it('listContainerVariants stagger is zero when reduced motion is preferred', () => {
    mockReducedMotion = true;
    const { result } = renderHook(() => useMotionConfig());
    const { listContainerVariants } = result.current;

    const visible = listContainerVariants.visible as Record<string, unknown>;
    const transition = visible.transition as Record<string, unknown>;
    expect(transition.staggerChildren).toBe(0);
  });
});
