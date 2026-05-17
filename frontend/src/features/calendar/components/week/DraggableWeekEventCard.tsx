import { useDraggable } from '@dnd-kit/core';
import type { MouseEvent } from 'react';
import type { CalendarEvent } from '@/types/calendar';
import { WeekEventCard } from './WeekEventCard';
import { DND_WEEK_CARD } from '../dnd/dndTypes';

interface DraggableWeekEventCardProps {
  readonly event: CalendarEvent;
  readonly top: number;
  readonly height: number;
  readonly laneIndex: number;
  readonly laneCount: number;
  readonly hasConflict: boolean;
  readonly dayIso: string;
  readonly onClick?: (event: CalendarEvent, mouse: MouseEvent<HTMLDivElement>) => void;
}

export function DraggableWeekEventCard({
  event,
  top,
  height,
  laneIndex,
  laneCount,
  hasConflict,
  dayIso,
  onClick,
}: DraggableWeekEventCardProps) {
  const dragId = `${DND_WEEK_CARD}:${event.executionId}:${dayIso}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: {
      type: DND_WEEK_CARD,
      event,
      dayIso,
    },
  });

  return (
    <WeekEventCard
      event={event}
      top={top}
      height={height}
      laneIndex={laneIndex}
      laneCount={laneCount}
      hasConflict={hasConflict}
      ghost={isDragging}
      draggableRef={setNodeRef}
      dragHandleProps={attributes as unknown as Record<string, unknown>}
      dragListeners={listeners as unknown as Record<string, unknown>}
      onClick={onClick}
    />
  );
}
