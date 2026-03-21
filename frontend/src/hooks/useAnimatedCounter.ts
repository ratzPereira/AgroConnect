import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface UseAnimatedCounterOptions {
  duration?: number;
  decimals?: number;
}

export function useAnimatedCounter(
  target: number,
  options: UseAnimatedCounterOptions = {},
): number {
  const { duration = 1000, decimals = 0 } = options;
  const prefersReducedMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const previousTargetRef = useRef<number>(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      const factor = Math.pow(10, decimals);
      setCurrent(Math.round(target * factor) / factor);
      return;
    }
    const startValue = previousTargetRef.current;
    previousTargetRef.current = target;
    if (target === startValue) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startValue + (target - startValue) * eased;
      const factor = Math.pow(10, decimals);
      setCurrent(Math.round(value * factor) / factor);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    startTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals, prefersReducedMotion]);

  return current;
}
