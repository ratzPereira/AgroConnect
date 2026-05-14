import { useState, useCallback } from 'react';
import type { ReactNode, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  readonly tabs: Tab[];
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (id: string) => void;
  readonly children: (activeTab: string) => ReactNode;
  readonly className?: string;
}

export function Tabs({ tabs, value, defaultValue, onChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || tabs[0]?.id || '');
  const activeTab = value ?? internalValue;

  const handleChange = useCallback(
    (id: string) => {
      if (!value) setInternalValue(id);
      onChange?.(id);
    },
    [value, onChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex: number;
      if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else return;

      e.preventDefault();
      handleChange(tabs[nextIndex].id);
      const button = e.currentTarget.parentElement?.children[nextIndex] as HTMLElement | undefined;
      button?.focus();
    },
    [tabs, handleChange],
  );

  return (
    <div className={cn(className)}>
      <div role="tablist" className="flex border-b border-neutral-200">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => handleChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors duration-150',
              activeTab === tab.id
                ? 'text-primary-600'
                : 'text-neutral-500 hover:text-neutral-700',
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                transition={{ type: 'tween', duration: 0.2 }}
              />
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-4">
        {children(activeTab)}
      </div>
    </div>
  );
}
