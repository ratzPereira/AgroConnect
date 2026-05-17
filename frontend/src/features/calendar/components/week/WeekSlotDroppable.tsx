// PERF NOTE: 7 days x 28 half-hour slots = 196 droppables per Week render.
// dnd-kit handles this fine today; if Month + Week + Day all use this pattern
// and we see lag during drags, consider a single per-column droppable with
// pointer-position math (see CalendarDnd Day-view handler for reference).
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/utils/cn';
import { DND_WEEK_DAY_SLOT } from '../dnd/dndTypes';

interface WeekSlotDroppableProps {
  readonly dayIso: string;
  readonly slotMinute: number;
  readonly top: number;
  readonly height: number;
}

export function WeekSlotDroppable({ dayIso, slotMinute, top, height }: WeekSlotDroppableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `week-slot:${dayIso}:${slotMinute}`,
    data: { type: DND_WEEK_DAY_SLOT, dayIso, slotMinute },
  });

  return (
    <div
      ref={setNodeRef}
      data-week-slot={`${dayIso}:${slotMinute}`}
      className={cn(
        'absolute inset-x-0 z-0',
        isOver && 'bg-primary-100/40 outline outline-2 -outline-offset-1 outline-primary-300',
      )}
      style={{ top, height }}
    />
  );
}
