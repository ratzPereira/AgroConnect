import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode, KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  readonly trigger: ReactNode;
  readonly items: DropdownItem[];
  readonly align?: 'left' | 'right';
  readonly className?: string;
}

export function Dropdown({ trigger, items, align = 'left', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const actionItems = items.filter((item) => !item.divider);

  const close = useCallback(() => {
    setOpen(false);
    setFocusIndex(-1);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, close]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(focusIndex + 1, actionItems.length - 1);
        setFocusIndex(next);
        itemRefs.current[next]?.focus();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(focusIndex - 1, 0);
        setFocusIndex(prev);
        itemRefs.current[prev]?.focus();
      }
      if (e.key === 'Enter' && focusIndex >= 0) {
        actionItems[focusIndex]?.onClick?.();
        close();
      }
    },
    [open, focusIndex, actionItems, close],
  );

  let actionIndex = 0;

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className="contents"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            onKeyDown={handleKeyDown}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'tween', duration: 0.15 }}
            className={cn(
              'absolute top-full mt-1 z-50 min-w-[180px] rounded-lg border border-neutral-200 bg-white py-1 shadow-dropdown',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {items.map((item) => {
              if (item.divider) {
                return <div key={item.id} className="my-1 border-t border-neutral-100" />;
              }
              const currentIndex = actionIndex++;
              return (
                <button
                  key={item.id}
                  ref={(el) => { itemRefs.current[currentIndex] = el; }}
                  onClick={() => { item.onClick?.(); close(); }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors duration-150',
                    item.danger
                      ? 'text-danger-600 hover:bg-danger-50'
                      : 'text-neutral-700 hover:bg-neutral-50',
                    focusIndex === currentIndex && (item.danger ? 'bg-danger-50' : 'bg-neutral-50'),
                  )}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <div className="min-w-0">
                    <span className="block font-medium">{item.label}</span>
                    {item.description && (
                      <span className="block text-xs text-neutral-500 mt-0.5">{item.description}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
