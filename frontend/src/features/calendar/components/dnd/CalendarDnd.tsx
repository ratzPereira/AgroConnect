import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { CalendarEvent } from '@/types/calendar';
// GhostBar is re-exported below; not imported here directly
import { useDragReschedule, type DragSession, type DropTarget } from '../../hooks/useDragReschedule';
import { SLOTS_PER_DAY, snapSlot } from '../../utils/timeMath';
import { toast } from 'sonner';
import {
  findLaneAtPoint,
  decodeLaneId,
  computeSessionSpan,
  extractDaysCount,
  extractDays,
} from './dndHelpers';
import { DND_WEEK_CARD, DND_WEEK_DAY_SLOT } from './dndTypes';

interface CalendarDndProps {
  readonly events: CalendarEvent[];
  readonly children: ReactNode;
}

export function CalendarDnd({ events, children }: CalendarDndProps) {
  const drag = useDragReschedule({ events });
  const [target, setTarget] = useState<DropTarget | null>(null);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    if (!drag.session) return;
    function onMove(e: PointerEvent) {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      updateTargetFromPointer();
    }
    globalThis.addEventListener('pointermove', onMove);
    return () => globalThis.removeEventListener('pointermove', onMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag.session]);

  function updateTargetFromPointer() {
    if (!drag.session) return;
    const { x, y } = pointerRef.current;
    const hit = findLaneAtPoint(x, y);
    if (!hit) {
      setTarget(null);
      return;
    }
    const span = drag.session.event.scheduledAllDay
      ? SLOTS_PER_DAY
      : Math.max(1, computeSessionSpan(drag.session));

    const offsetX = x - hit.rect.left;
    const slotWidth = hit.rect.width / (SLOTS_PER_DAY * extractDaysCount(hit.el));
    const absoluteSlot = Math.floor(offsetX / slotWidth);
    const dayIndex = Math.floor(absoluteSlot / SLOTS_PER_DAY);
    const slotInDay = absoluteSlot - dayIndex * SLOTS_PER_DAY;
    const snapped = snapSlot(slotInDay);
    const days = extractDays(hit.el);
    const dayIso = days[Math.min(Math.max(dayIndex, 0), days.length - 1)] ?? days[0];
    if (!dayIso) {
      setTarget(null);
      return;
    }

    const startSlot = Math.max(0, Math.min(snapped, SLOTS_PER_DAY - span));
    const meta = decodeLaneId(hit.laneId);
    setTarget({
      laneId: hit.laneId,
      resourceType: meta.resourceType,
      resourceId: meta.resourceId,
      dayIso,
      startSlot,
      spanSlots: span,
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as
      | { type?: string; event: CalendarEvent; laneId?: string; dayIso?: string }
      | undefined;
    if (!data) return;
    if (data.type === DND_WEEK_CARD) {
      const session: DragSession = {
        event: data.event,
        laneId: `week-${data.dayIso ?? ''}`,
        resourceType: 'job',
        resourceId: data.event.executionId,
      };
      drag.startDrag(session);
      return;
    }
    if (!data.laneId) return;
    const meta = decodeLaneId(data.laneId);
    const session: DragSession = {
      event: data.event,
      laneId: data.laneId,
      resourceType: meta.resourceType,
      resourceId: meta.resourceId,
    };
    drag.startDrag(session);
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (!drag.session) return;

    const overData = event.over?.data.current as
      | { type?: string; dayIso?: string; slotMinute?: number }
      | undefined;
    if (
      overData?.type === DND_WEEK_DAY_SLOT &&
      typeof overData.dayIso === 'string' &&
      typeof overData.slotMinute === 'number'
    ) {
      try {
        await drag.applyDrop({
          type: DND_WEEK_DAY_SLOT,
          dayIso: overData.dayIso,
          slotMinute: overData.slotMinute,
        });
      } catch {
        // toast handled by mutation
      } finally {
        setTarget(null);
      }
      return;
    }

    if (!target) {
      drag.endDrag();
      setTarget(null);
      return;
    }
    const { conflict, reason } = drag.previewConflict(target);
    if (conflict) {
      toast.error(reason ?? 'Não é possível mover: conflito de recursos');
      drag.endDrag();
      setTarget(null);
      return;
    }
    try {
      await drag.applyDrop(target);
    } catch {
      // toast handled by mutation
    } finally {
      setTarget(null);
    }
  }

  const preview = target ? drag.previewConflict(target) : { conflict: false };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
      <DragOverlay dropAnimation={null}>
        {drag.session ? (
          <div className="pointer-events-none rounded-md border-2 border-dashed border-primary-500 bg-primary-100/70 px-3 py-1.5 text-xs font-semibold text-primary-800 shadow-md">
            {drag.session.event.requestTitle}
            {target && (
              <span className="ml-2 font-mono text-[10px] opacity-80">
                · {drag.describeProposedTime(target.startSlot, target.spanSlots)}
              </span>
            )}
            {preview.conflict && (
              <span className="ml-2 rounded bg-danger-500 px-1 py-0.5 text-[10px] text-white">!</span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export { GhostBar } from '../primitives/GhostBar';
