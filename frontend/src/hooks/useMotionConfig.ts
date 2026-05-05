import { useReducedMotion } from 'framer-motion';
import type { Variants, Transition } from 'framer-motion';

interface MotionConfig {
  pageVariants: Variants;
  pageTransition: Transition;
  listContainerVariants: Variants;
  listItemVariants: Variants;
  fadeInVariants: Variants;
  shouldAnimate: boolean;
}

export function useMotionConfig(): MotionConfig {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  const pageVariants: Variants = {
    initial: shouldAnimate ? { opacity: 0, y: 8 } : { opacity: 1 },
    animate: shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1 },
    exit: shouldAnimate ? { opacity: 0 } : { opacity: 1 },
  };

  const pageTransition: Transition = {
    type: 'tween',
    ease: 'easeOut',
    duration: shouldAnimate ? 0.2 : 0,
  };

  const listContainerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: shouldAnimate ? 0.05 : 0 },
    },
  };

  const listItemVariants: Variants = {
    hidden: shouldAnimate ? { opacity: 0, y: 8 } : { opacity: 1 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'tween', ease: 'easeOut', duration: 0.2 },
    },
  };

  const fadeInVariants: Variants = {
    hidden: shouldAnimate ? { opacity: 0 } : { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { type: 'tween', duration: 0.15 },
    },
  };

  return { pageVariants, pageTransition, listContainerVariants, listItemVariants, fadeInVariants, shouldAnimate };
}
