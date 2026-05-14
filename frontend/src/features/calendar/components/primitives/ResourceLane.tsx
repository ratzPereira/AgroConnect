import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { SLOTS_PER_DAY } from '../../utils/timeMath';
import { TimeGridBackground } from './TimeAxis';

interface ResourceLaneProps {
  readonly label: string;
  readonly sublabel?: string;
  readonly icon?: ReactNode;
  readonly days?: number;
  readonly rowsCount?: number;
  readonly rowHeight?: number;
  readonly className?: string;
  readonly children?: ReactNode;
  readonly dropTargetProps?: Record<string, unknown>;
  readonly dropRef?: (node: HTMLElement | null) => void;
  readonly isDropActive?: boolean;
  readonly 'data-lane-id'?: string;
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
  ...rest
}: ResourceLaneProps) {
  const totalSlots = SLOTS_PER_DAY * days;
  const safeRows = Math.max(1, rowsCount);

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

      <div ref={dropRef} className="relative flex-1" {...dropTargetProps} {...rest}>
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
