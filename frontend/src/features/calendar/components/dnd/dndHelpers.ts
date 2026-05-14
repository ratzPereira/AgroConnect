import type { DragSession } from '../../hooks/useDragReschedule';

export function findLaneAtPoint(x: number, y: number): {
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

export function decodeLaneId(laneId: string): {
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

export function parseHHMM(value?: string | null): number | null {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return (h - 6) * 60 + m;
}

export function computeSessionSpan(session: DragSession): number {
  const start = parseHHMM(session.event.scheduledStartTime);
  const end = parseHHMM(session.event.scheduledEndTime);
  if (start == null || end == null) return 2;
  return Math.max(1, Math.round((end - start) / 30));
}

export function extractDaysCount(el: HTMLElement): number {
  const raw = el.dataset.daysCount;
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 1;
}

export function extractDays(el: HTMLElement): string[] {
  const raw = el.dataset.days;
  if (!raw) return [];
  return raw.split(',');
}
