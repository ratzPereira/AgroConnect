import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { SLOTS_PER_DAY } from '../../utils/timeMath';
import { TimeGridBackground } from './TimeAxis';

interface ResourceLaneProps {
  label: string;
  sublabel?: string;
  icon?: ReactNode;
  days?: number;
  rowsCount?: number;
  rowHeight?: number;
  className?: string;
  children?: ReactNode;
  dropTargetProps?: Record<string, unknown>;
  dropRef?: (node: HTMLElement | null) => void;
  isDropActive?: boolean;
  onLaneClick?: (slotIndex: number) => void;
  'data-lane-id'?: string;
}

export function ResourceLane({
  label,
  sublabel,
  icon,
  days = 1,
  rowsCount = 1,
  rowHeight = 44,
  className,
  children,
  dropTargetProps,
  dropRef,
  isDropActive = false,
  onLaneClick,
  ...rest
}: ResourceLaneProps) {
  const totalSlots = SLOTS_PER_DAY * days;
  const safeRows = Math.max(1, rowsCount);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onLaneClick) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const slotWidth = rect.width / totalSlots;
    const slotIndex = Math.floor(offsetX / slotWidth);
    onLaneClick(slotIndex);
  }

  return (
    <div
      className={cn(
        'flex border-b border-neutral-200',
        isDropActive && 'bg-primary-50/40',
        className,
      )}
      style={{ minHeight: `${rowHeight * safeRows}px` }}
    >
      <div className="flex w-44 flex-shrink-0 items-center gap-2 border-r border-neutral-200 bg-neutral-50 px-3 py-2">
        {icon && <div className="flex-shrink-0 text-neutral-500">{icon}</div>}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-900">{label}</p>
          {sublabel && <p className="truncate text-[11px] text-neutral-500">{sublabel}</p>}
        </div>
      </div>

      <div
        ref={dropRef}
        className="relative flex-1"
        {...dropTargetProps}
        {...rest}
        onClick={handleClick}
        role={onLaneClick ? 'button' : undefined}
        tabIndex={onLaneClick ? 0 : undefined}
      >
        <TimeGridBackground days={days} />
        <div
          className="relative grid h-full"
          style={{
            gridTemplateColumns: `repeat(${totalSlots}, minmax(0, 1fr))`,
            gridAutoRows: `${rowHeight}px`,
            gridTemplateRows: `repeat(${safeRows}, ${rowHeight}px)`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
