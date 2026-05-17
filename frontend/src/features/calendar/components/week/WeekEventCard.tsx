import { useMemo, type CSSProperties, type MouseEvent } from 'react';
import { cn } from '@/utils/cn';
import type { CalendarEvent } from '@/types/calendar';
import { getEventVisualStyle } from '../../utils/eventStyles';

interface WeekEventCardProps {
  readonly event: CalendarEvent;
  readonly top: number;
  readonly height: number;
  readonly laneIndex: number;
  readonly laneCount: number;
  readonly hasConflict: boolean;
  readonly onClick?: (event: CalendarEvent, mouse: MouseEvent<HTMLDivElement>) => void;
  readonly ghost?: boolean;
  readonly draggableRef?: (node: HTMLElement | null) => void;
  readonly dragHandleProps?: Record<string, unknown>;
  readonly dragListeners?: Record<string, unknown>;
}

const GAP_PERCENT = 1.5;

export function WeekEventCard({
  event,
  top,
  height,
  laneIndex,
  laneCount,
  hasConflict,
  onClick,
  ghost = false,
  draggableRef,
  dragHandleProps,
  dragListeners,
}: WeekEventCardProps) {
  const visual = useMemo(() => getEventVisualStyle(event, hasConflict), [event, hasConflict]);
  const widthPercent = 100 / laneCount - GAP_PERCENT;
  const leftPercent = (100 / laneCount) * laneIndex + GAP_PERCENT / 2;

  const style: CSSProperties = {
    top,
    height,
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
  };

  const operatorName = event.assignments[0]?.teamMemberName;
  const machineName = event.assignments.find((a) => a.machineName)?.machineName;
  const dense = height < 48;

  return (
    <div
      ref={(node) => draggableRef?.(node)}
      role="button"
      tabIndex={0}
      data-execution-id={event.executionId}
      aria-label={event.requestTitle}
      className={cn(
        'absolute z-20 overflow-hidden rounded-md px-2 py-1 text-left shadow-sm transition-all cursor-pointer',
        visual.barClass,
        visual.borderClass,
        ghost && 'opacity-60 pointer-events-none border-dashed',
      )}
      style={style}
      onClick={(e) => onClick?.(event, e)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(event, e as unknown as MouseEvent<HTMLDivElement>);
        }
      }}
      {...dragHandleProps}
      {...dragListeners}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[10px] font-mono font-semibold leading-tight">
          {event.scheduledStartTime}–{event.scheduledEndTime}
        </span>
        {(visual.urgencyBadge || visual.conflictBadge) && (
          <span className="flex flex-shrink-0 items-center gap-0.5">
            {visual.conflictBadge}
            {visual.urgencyBadge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 truncate text-[11px] font-semibold leading-tight">
        <span aria-hidden>{visual.statusIcon}</span>
        <span className="truncate">{event.requestTitle}</span>
      </div>
      {!dense && operatorName && (
        <div className="mt-0.5 truncate text-[10px] opacity-90">{operatorName}</div>
      )}
      {!dense && machineName && height >= 64 && (
        <div className="truncate text-[9px] opacity-80">{machineName}</div>
      )}
    </div>
  );
}
