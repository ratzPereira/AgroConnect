import type { CSSProperties } from 'react';
import { cn } from '@/utils/cn';
import { formatTime, slotToTime } from '../../utils/timeMath';

interface GhostBarProps {
  startSlot: number;
  spanSlots: number;
  laneRow?: number;
  laneRowSpan?: number;
  hasConflict?: boolean;
  label?: string;
  className?: string;
}

export function GhostBar({
  startSlot,
  spanSlots,
  laneRow,
  laneRowSpan,
  hasConflict = false,
  label,
  className,
}: GhostBarProps) {
  const safeSpan = Math.max(1, spanSlots);
  const start = slotToTime(startSlot);
  const end = slotToTime(startSlot + safeSpan);

  const style: CSSProperties = {
    gridColumn: `${startSlot + 1} / span ${safeSpan}`,
    gridRow: laneRow ? `${laneRow} / span ${laneRowSpan ?? 1}` : undefined,
  };

  return (
    <div
      className={cn(
        'pointer-events-none relative my-1 mx-0.5 flex h-9 items-center justify-center rounded-md border-2 border-dashed px-2 text-xs font-medium shadow-sm',
        hasConflict
          ? 'border-danger-500 bg-danger-100/70 text-danger-800'
          : 'border-primary-500 bg-primary-100/70 text-primary-800',
        className,
      )}
      style={style}
      aria-hidden
    >
      <span className="truncate">
        {label ?? 'Novo horário'} · {formatTime(start)}–{formatTime(end)}
      </span>
    </div>
  );
}
