import { useDraggable } from '@dnd-kit/core';
import type { CalendarEvent } from '@/types/calendar';
import { GanttBarV2 } from '../primitives/GanttBarV2';

interface DraggableBarProps {
  readonly event: CalendarEvent;
  readonly startSlot: number;
  readonly spanSlots: number;
  readonly laneRow?: number;
  readonly hasConflict?: boolean;
  readonly laneId: string;
  readonly resourceType: 'operator' | 'machine' | 'job';
  readonly resourceId: number | null;
  readonly dayIso: string;
  readonly onClick?: (event: CalendarEvent) => void;
}

export function DraggableBar({
  event,
  startSlot,
  spanSlots,
  laneRow,
  hasConflict,
  laneId,
  resourceType,
  resourceId,
  dayIso,
  onClick,
}: DraggableBarProps) {
  const dragId = `bar:${event.executionId}:${laneId}:${dayIso}:${startSlot}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: {
      type: 'bar',
      event,
      laneId,
      resourceType,
      resourceId,
      spanSlots,
      dayIso,
      startSlot,
    },
  });

  return (
    <GanttBarV2
      event={event}
      startSlot={startSlot}
      spanSlots={spanSlots}
      laneRow={laneRow}
      hasConflict={hasConflict}
      ghost={isDragging}
      draggableRef={setNodeRef}
      dragHandleProps={attributes as unknown as Record<string, unknown>}
      dragListeners={listeners as unknown as Record<string, unknown>}
      onClick={(e) => onClick?.(e)}
      showResizeHandles={false}
    />
  );
}
