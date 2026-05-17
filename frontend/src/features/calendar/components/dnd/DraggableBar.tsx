import { useDraggable } from '@dnd-kit/core';
import type { MouseEvent } from 'react';
import type { CalendarEvent } from '@/types/calendar';
import { GanttBarV2 } from '../primitives/GanttBarV2';
import { DND_BAR } from './dndTypes';

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
  readonly onClick?: (event: CalendarEvent, mouse: MouseEvent<HTMLDivElement>) => void;
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
  const dragId = `${DND_BAR}:${event.executionId}:${laneId}:${dayIso}:${startSlot}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: {
      type: DND_BAR,
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
      onClick={onClick}
      showResizeHandles={false}
    />
  );
}
