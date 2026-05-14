import { forwardRef, type CSSProperties, type MouseEvent } from 'react';
import { cn } from '@/utils/cn';
import type { CalendarEvent } from '@/types/calendar';
import { parseTime, formatTime } from '../../utils/timeMath';

interface GanttBarV2Props {
  readonly event: CalendarEvent;
  readonly startSlot: number;
  readonly spanSlots: number;
  readonly laneRow?: number;
  readonly laneRowSpan?: number;
  readonly hasConflict?: boolean;
  readonly ghost?: boolean;
  readonly draggableRef?: (node: HTMLElement | null) => void;
  readonly dragHandleProps?: Record<string, unknown>;
  readonly dragListeners?: Record<string, unknown>;
  readonly onClick?: (event: CalendarEvent, mouse: MouseEvent<HTMLDivElement>) => void;
  readonly onResizeStart?: (side: 'start' | 'end', mouseEvent: MouseEvent<HTMLDivElement>) => void;
  readonly className?: string;
  readonly showResizeHandles?: boolean;
}

const URGENCY_STYLES: Record<string, { bar: string; ring: string }> = {
  HIGH: {
    bar: 'bg-warning-500 hover:bg-warning-600 border-warning-700 text-white',
    ring: 'ring-warning-300',
  },
  MEDIUM: {
    bar: 'bg-primary-500 hover:bg-primary-600 border-primary-700 text-white',
    ring: 'ring-primary-300',
  },
  LOW: {
    bar: 'bg-secondary-400 hover:bg-secondary-500 border-secondary-600 text-white',
    ring: 'ring-secondary-300',
  },
};

const STATUS_ICONS: Record<string, string> = {
  IN_PROGRESS: '●',
  AWAITING_CONFIRMATION: '◐',
  COMPLETED: '✓',
  RATED: '✓',
  AWARDED: '○',
};

export const GanttBarV2 = forwardRef<HTMLDivElement, GanttBarV2Props>(function GanttBarV2(
  {
    event,
    startSlot,
    spanSlots,
    laneRow,
    laneRowSpan,
    hasConflict = false,
    ghost = false,
    dragHandleProps,
    dragListeners,
    onClick,
    onResizeStart,
    className,
    showResizeHandles = true,
    draggableRef,
  },
  ref,
) {
  const style = URGENCY_STYLES[event.urgency] ?? URGENCY_STYLES.MEDIUM;
  const safeSpan = Math.max(1, spanSlots);
  const startTime = parseTime(event.scheduledStartTime);
  const endTime = parseTime(event.scheduledEndTime);

  const gridStyle: CSSProperties = {
    gridColumn: `${startSlot + 1} / span ${safeSpan}`,
    gridRow: laneRow ? `${laneRow} / span ${laneRowSpan ?? 1}` : undefined,
  };

  const statusIcon = STATUS_ICONS[event.status] ?? '·';
  const operatorName = event.assignments[0]?.teamMemberName ?? 'Sem operador';
  const machineName = event.assignments.find((a) => a.machineName)?.machineName ?? null;

  function setRefs(node: HTMLDivElement | null) {
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (draggableRef) draggableRef(node);
  }

  return (
    <div
      ref={setRefs}
      // NOSONAR: bar contains nested resize buttons, so <button> tag would be invalid HTML
      role="button"
      tabIndex={0}
      data-execution-id={event.executionId}
      aria-label={event.requestTitle}
      className={cn(
        'group relative my-1 mx-0.5 flex h-9 cursor-pointer items-center overflow-hidden rounded-md border px-2 shadow-sm transition-all',
        style.bar,
        hasConflict && cn('ring-2 ring-offset-1', 'ring-danger-400'),
        ghost && 'opacity-60 pointer-events-none border-dashed',
        className,
      )}
      style={gridStyle}
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
      {showResizeHandles && !ghost && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Redimensionar início"
          className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize bg-black/0 hover:bg-black/20"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart?.('start', e as unknown as MouseEvent<HTMLDivElement>);
          }}
        />
      )}

      <span className="flex flex-1 items-center gap-1.5 truncate text-xs font-medium leading-tight">
        <span className="text-[11px] opacity-90" aria-hidden>
          {statusIcon}
        </span>
        <span className="truncate">{event.requestTitle}</span>
      </span>

      {safeSpan >= 4 && (
        <div className="ml-2 hidden flex-shrink-0 items-center gap-1 text-[10px] opacity-90 sm:flex">
          {startTime && endTime && (
            <span className="rounded bg-black/20 px-1 py-0.5 font-mono">
              {formatTime(startTime)}–{formatTime(endTime)}
            </span>
          )}
          {operatorName && safeSpan >= 6 && (
            <span className="max-w-[80px] truncate">{operatorName.split(' ')[0]}</span>
          )}
          {machineName && safeSpan >= 8 && (
            <span className="max-w-[80px] truncate opacity-80">· {machineName}</span>
          )}
        </div>
      )}

      {showResizeHandles && !ghost && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Redimensionar fim"
          className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize bg-black/0 hover:bg-black/20"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart?.('end', e as unknown as MouseEvent<HTMLDivElement>);
          }}
        />
      )}
    </div>
  );
});
