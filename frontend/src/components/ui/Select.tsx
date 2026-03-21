import { useState, useRef, useEffect, useCallback, forwardRef, useId } from 'react';
import type { KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
  name?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ options, value, onChange, placeholder = 'Selecionar...', searchable, disabled, error, label, className, name }, ref) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [focusIndex, setFocusIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const selectId = useId();

    const filtered = search
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;

    const selected = options.find((o) => o.value === value);

    const close = useCallback(() => {
      setOpen(false);
      setSearch('');
      setFocusIndex(-1);
    }, []);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
      };
      if (open) {
        document.addEventListener('mousedown', handleClickOutside);
        if (searchable) setTimeout(() => searchRef.current?.focus(), 50);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, close, searchable]);

    const handleSelect = useCallback(
      (val: string) => {
        onChange?.(val);
        close();
      },
      [onChange, close],
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (!open) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
          return;
        }
        if (e.key === 'Escape') { close(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIndex((i) => Math.min(i + 1, filtered.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIndex((i) => Math.max(i - 1, 0)); }
        if (e.key === 'Enter' && focusIndex >= 0 && filtered[focusIndex]) {
          handleSelect(filtered[focusIndex].value);
        }
      },
      [open, close, focusIndex, filtered, handleSelect],
    );

    return (
      <div ref={containerRef} className={cn('relative', className)} onKeyDown={handleKeyDown}>
        {label && (
          <label htmlFor={selectId} className="block text-[13px] font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}
        <input type="hidden" name={name} value={value || ''} />
        <button
          ref={ref}
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(!open)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm text-left transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-danger-400' : 'border-neutral-300 hover:border-neutral-400',
          )}
        >
          <span className={selected ? 'text-neutral-800' : 'text-neutral-400'}>
            {selected?.label || placeholder}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-neutral-400 transition-transform duration-150', open && 'rotate-180')} />
        </button>
        {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'tween', duration: 0.15 }}
              className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-neutral-200 bg-white py-1 shadow-dropdown max-h-60 overflow-y-auto"
            >
              {searchable && (
                <div className="px-2 pb-1.5 pt-1">
                  <div className="flex items-center gap-2 rounded-md border border-neutral-200 px-2.5 py-1.5">
                    <Search className="h-4 w-4 text-neutral-400" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setFocusIndex(-1); }}
                      placeholder="Pesquisar..."
                      className="flex-1 text-sm outline-none bg-transparent text-neutral-800 placeholder:text-neutral-400"
                    />
                  </div>
                </div>
              )}
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-neutral-500">Sem resultados</p>
              ) : (
                filtered.map((option, i) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex w-full items-center px-3 py-2 text-sm text-left transition-colors duration-150',
                      option.value === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-700 hover:bg-neutral-50',
                      focusIndex === i && 'bg-neutral-50',
                    )}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

Select.displayName = 'Select';
