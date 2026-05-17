import { useMemo, type MouseEvent } from 'react';
import { cn } from '@/utils/cn';
import type { CalendarEvent } from '@/types/calendar';
import { getEventVisualStyle } from '../../utils/eventStyles';

interface MonthEventChipProps {
  readonly event: CalendarEvent;
  readonly hasConflict: boolean;
  readonly onClick?: (event: CalendarEvent, mouse: MouseEvent<HTMLButtonElement>) => void;
}

export function MonthEventChip({ event, hasConflict, onClick }: MonthEventChipProps) {
  const visual = useMemo(() => getEventVisualStyle(event, hasConflict), [event, hasConflict]);
  const timeLabel = event.scheduledAllDay ? 'Dia inteiro' : event.scheduledStartTime ?? '';
  return (
    <button
      type="button"
      onClick={(e) => onClick?.(event, e)}
      className={cn(
        'flex h-5 w-full items-center gap-1 truncate rounded border px-1.5 text-left text-[10px] font-medium leading-none',
        visual.chipClass,
        hasConflict && 'ring-1 ring-danger-400',
      )}
      title={`${event.requestTitle} — ${event.categoryName}`}
    >
      <span className="font-mono text-[9px] opacity-80">{timeLabel}</span>
      <span className="truncate">{event.requestTitle}</span>
    </button>
  );
}
