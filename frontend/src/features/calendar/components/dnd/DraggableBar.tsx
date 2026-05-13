import { useDraggable } from '@dnd-kit/core';
import type { CalendarEvent } from '@/types/calendar';
import { GanttBarV2 } from '../primitives/GanttBarV2';

interface DraggableBarProps {
  event: CalendarEvent;
  startSlot: number;
  spanSlots: number;
  laneRow?: number;
  hasConflict?: boolean;
  laneId: string;
  resourceType: 'operator' | 'machine' | 'job';
  resourceId: number | null;
  dayIso: string;
  onClick?: (event: CalendarEvent) => void;
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
