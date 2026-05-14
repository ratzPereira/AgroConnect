import { cloneElement, useState, useRef, useId, useCallback } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';

type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

interface TooltipProps {
  readonly content: ReactNode;
  readonly position?: TooltipPosition;
  readonly delay?: number;
  readonly children: ReactElement;
  readonly className?: string;
}

const positionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowStyles: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral-800 border-x-transparent border-b-transparent border-4',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-neutral-800 border-x-transparent border-t-transparent border-4',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-neutral-800 border-y-transparent border-r-transparent border-4',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-neutral-800 border-y-transparent border-l-transparent border-4',
};

export function Tooltip({ content, position = 'top', delay = 300, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const tooltipId = useId();

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const childProps = (children.props ?? {}) as Record<string, unknown>;
  const composedHandler = <T,>(existing: unknown, next: () => void) => (e: T) => {
    (existing as ((event: T) => void) | undefined)?.(e);
    next();
  };
  const trigger = cloneElement(children, {
    onMouseEnter: composedHandler(childProps.onMouseEnter, show),
    onMouseLeave: composedHandler(childProps.onMouseLeave, hide),
    onFocus: composedHandler(childProps.onFocus, show),
    onBlur: composedHandler(childProps.onBlur, hide),
    'aria-describedby': visible ? tooltipId : undefined,
  } as Record<string, unknown>);

  return (
    <span className="relative inline-flex">
      {trigger}
      <AnimatePresence>
        {visible && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', duration: 0.15 }}
            className={cn(
              'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-neutral-800 rounded-md whitespace-nowrap pointer-events-none',
              positionStyles[position],
              className,
            )}
          >
            {content}
            <span className={cn('absolute', arrowStyles[position])} />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
