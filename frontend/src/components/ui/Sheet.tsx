import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface SheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="absolute inset-0 bg-neutral-900/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_e, info) => {
              if (info.velocity.y > 500 || info.offset.y > 100) onClose();
            }}
            className={cn(
              'relative w-full md:max-w-lg max-h-[85vh] rounded-t-2xl bg-white shadow-xl overflow-y-auto',
              className,
            )}
          >
            <div className="sticky top-0 flex justify-center py-3 bg-white rounded-t-2xl z-10">
              <div className="h-1 w-8 rounded-full bg-neutral-300" />
            </div>
            {title && (
              <div className="px-6 pb-3">
                <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
              </div>
            )}
            <div className="px-6 pb-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
