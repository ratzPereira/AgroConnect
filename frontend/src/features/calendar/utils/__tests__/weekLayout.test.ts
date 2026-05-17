import { describe, it, expect } from 'vitest';
import { buildDayLayout } from '../weekLayout';
import type { CalendarEvent } from '@/types/calendar';

function evt(id: number, start: string, end: string, status = 'IN_PROGRESS'): CalendarEvent {
  return {
    executionId: id,
    requestId: id + 100,
    requestTitle: `Job ${id}`,
    categoryName: 'Lavoura',
    scheduledDate: '2026-05-17',
    scheduledEndDate: '2026-05-17',
    scheduledStartTime: start,
    scheduledEndTime: end,
    scheduledAllDay: false,
    urgency: 'MEDIUM',
    status,
    island: 'Terceira',
    parish: 'Sé',
    assignments: [],
  } as CalendarEvent;
}

describe('buildDayLayout', () => {
  it('places a single event in lane 0 with full width', () => {
    const layout = buildDayLayout([evt(1, '08:00', '12:00')], '2026-05-17', new Set());
    expect(layout).toHaveLength(1);
    expect(layout[0].laneIndex).toBe(0);
    expect(layout[0].laneCount).toBe(1);
    expect(layout[0].top).toBeGreaterThanOrEqual(0);
    expect(layout[0].height).toBeGreaterThan(0);
  });

  it('places two overlapping events in separate lanes with laneCount=2', () => {
    const layout = buildDayLayout(
      [evt(1, '08:00', '12:00'), evt(2, '10:00', '14:00')],
      '2026-05-17',
      new Set(),
    );
    expect(layout).toHaveLength(2);
    expect(layout.map((l) => l.laneCount)).toEqual([2, 2]);
    expect(new Set(layout.map((l) => l.laneIndex))).toEqual(new Set([0, 1]));
  });

  it('places two non-overlapping events both in lane 0 with laneCount=1', () => {
    const layout = buildDayLayout(
      [evt(1, '08:00', '10:00'), evt(2, '10:00', '12:00')],
      '2026-05-17',
      new Set(),
    );
    expect(layout.map((l) => l.laneCount)).toEqual([1, 1]);
  });

  it('skips all-day events', () => {
    const allDay = { ...evt(1, '08:00', '20:00'), scheduledAllDay: true };
    const layout = buildDayLayout([allDay as CalendarEvent], '2026-05-17', new Set());
    expect(layout).toHaveLength(0);
  });

  it('flags events as hasConflict when in conflict set', () => {
    const layout = buildDayLayout([evt(1, '08:00', '12:00')], '2026-05-17', new Set([1]));
    expect(layout[0].hasConflict).toBe(true);
  });

  it('skips events that do not span the requested day', () => {
    const layout = buildDayLayout([evt(1, '08:00', '12:00')], '2026-05-18', new Set());
    expect(layout).toHaveLength(0);
  });

  it('clips multi-day events to working hours on intermediate/last days', () => {
    const multi = {
      ...evt(1, '08:00', '12:00'),
      scheduledDate: '2026-05-17',
      scheduledEndDate: '2026-05-18',
    } as CalendarEvent;
    const layout = buildDayLayout([multi], '2026-05-18', new Set());
    expect(layout).toHaveLength(1);
    expect(layout[0].top).toBe(0);
  });
});
