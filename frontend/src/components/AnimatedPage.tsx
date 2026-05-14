import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useMotionConfig } from '@/hooks/useMotionConfig';

interface AnimatedPageProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  const { pageVariants, pageTransition } = useMotionConfig();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
