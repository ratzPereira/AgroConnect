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

interface CalendarDndProps {
  readonly events: CalendarEvent[];
  readonly children: ReactNode;
}

function findLaneAtPoint(x: number, y: number): {
  el: HTMLElement;
  laneId: string;
  rect: DOMRect;
} | null {
  const stack = document.elementsFromPoint(x, y);
  for (const node of stack) {
    const el = node as HTMLElement;
    if (el.dataset?.laneId) {
      return { el, laneId: el.dataset.laneId, rect: el.getBoundingClientRect() };
    }
  }
  return null;
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
    const data = event.active.data.current as { event: CalendarEvent; laneId: string } | undefined;
    if (!data) return;
    const meta = decodeLaneId(data.laneId);
    const session: DragSession = {
      event: data.event,
      laneId: data.laneId,
      resourceType: meta.resourceType,
      resourceId: meta.resourceId,
    };
    drag.startDrag(session);
  }

  async function handleDragEnd(_event: DragEndEvent) {
    if (!drag.session) return;
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

function decodeLaneId(laneId: string): {
  resourceType: 'operator' | 'machine' | 'job';
  resourceId: number | null;
} {
  if (laneId.startsWith('op-none')) return { resourceType: 'operator', resourceId: null };
  if (laneId.startsWith('op-')) {
    const id = Number(laneId.slice(3));
    return { resourceType: 'operator', resourceId: Number.isFinite(id) ? id : null };
  }
  if (laneId.startsWith('m-')) {
    const id = Number(laneId.slice(2));
    return { resourceType: 'machine', resourceId: Number.isFinite(id) ? id : null };
  }
  if (laneId.startsWith('job-')) {
    const id = Number(laneId.slice(4));
    return { resourceType: 'job', resourceId: Number.isFinite(id) ? id : null };
  }
  return { resourceType: 'operator', resourceId: null };
}

function computeSessionSpan(session: DragSession): number {
  const start = parseHHMM(session.event.scheduledStartTime);
  const end = parseHHMM(session.event.scheduledEndTime);
  if (start == null || end == null) return 2;
  return Math.max(1, Math.round((end - start) / 30));
}

function parseHHMM(value?: string | null): number | null {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return (h - 6) * 60 + m;
}

function extractDaysCount(el: HTMLElement): number {
  const raw = el.dataset.daysCount;
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 1;
}

function extractDays(el: HTMLElement): string[] {
  const raw = el.dataset.days;
  if (!raw) return [];
  return raw.split(',');
}

export { GhostBar } from '../primitives/GhostBar';
