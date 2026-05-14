import { describe, it, expect } from 'vitest';
import {
  buildConflictSet,
  computePlacement,
  packRows,
  buildLanesForRange,
} from '../laneBuilders';
import type { CalendarEvent, ConflictResponse } from '@/types/calendar';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    executionId: 1,
    requestId: 1,
    requestTitle: 'Test Job',
    categoryName: 'Limpeza',
    scheduledDate: '2026-04-15',
    scheduledEndDate: '2026-04-15',
    scheduledStartTime: '09:00',
    scheduledEndTime: '11:00',
    scheduledAllDay: false,
    status: 'IN_PROGRESS',
    island: 'São Miguel',
    parish: 'Ponta Delgada',
    urgency: 'MEDIUM',
    assignments: [],
    ...overrides,
  };
}

describe('buildConflictSet', () => {
  it('returns empty set for empty conflicts', () => {
    expect(buildConflictSet([])).toEqual(new Set());
  });

  it('collects all conflicting executionIds across conflicts', () => {
    const conflicts: ConflictResponse[] = [
      {
        date: '2026-04-15',
        resourceType: 'TEAM_MEMBER',
        resourceId: 1,
        resourceName: 'João',
        conflictingEvents: [
          { executionId: 100, requestTitle: 'A' },
          { executionId: 101, requestTitle: 'B' },
        ],
      },
      {
        date: '2026-04-16',
        resourceType: 'MACHINE',
        resourceId: 9,
        resourceName: 'Trator',
        conflictingEvents: [{ executionId: 101, requestTitle: 'B' }],
      },
    ];
    expect(buildConflictSet(conflicts)).toEqual(new Set([100, 101]));
  });
});

describe('computePlacement', () => {
  it('returns null for all-day events', () => {
    expect(
      computePlacement(makeEvent({ scheduledAllDay: true }), '2026-04-15'),
    ).toBeNull();
  });

  it('returns null when dayIso is before scheduledDate', () => {
    expect(computePlacement(makeEvent(), '2026-04-14')).toBeNull();
  });

  it('returns null when dayIso is after scheduledEndDate', () => {
    expect(computePlacement(makeEvent(), '2026-04-16')).toBeNull();
  });

  it('returns null when start/end time cannot be parsed', () => {
    expect(
      computePlacement(makeEvent({ scheduledStartTime: null, scheduledEndTime: null }), '2026-04-15'),
    ).toBeNull();
  });

  it('returns valid placement for a same-day timed event', () => {
    const placement = computePlacement(makeEvent(), '2026-04-15', 0);
    expect(placement).not.toBeNull();
    expect(placement!.spanSlots).toBeGreaterThan(0);
    expect(placement!.startSlot).toBeGreaterThanOrEqual(0);
    expect(placement!.laneRow).toBe(1);
  });

  it('offsets startSlot by dayIndex × SLOTS_PER_DAY', () => {
    const p0 = computePlacement(makeEvent(), '2026-04-15', 0)!;
    const p2 = computePlacement(makeEvent(), '2026-04-15', 2)!;
    expect(p2.startSlot - p0.startSlot).toBeGreaterThan(0);
  });

  it('handles multi-day events with first/middle/last day slot calculations', () => {
    const multiDay = makeEvent({
      scheduledDate: '2026-04-15',
      scheduledEndDate: '2026-04-17',
      scheduledStartTime: '09:00',
      scheduledEndTime: '11:00',
    });
    const firstDay = computePlacement(multiDay, '2026-04-15', 0);
    const middleDay = computePlacement(multiDay, '2026-04-16', 1);
    const lastDay = computePlacement(multiDay, '2026-04-17', 2);
    expect(firstDay).not.toBeNull();
    expect(middleDay).not.toBeNull();
    expect(lastDay).not.toBeNull();
  });
});

describe('packRows', () => {
  it('places non-overlapping events on the same row', () => {
    const items = [
      { event: makeEvent({ executionId: 1 }), placement: { startSlot: 0, spanSlots: 4, laneRow: 1 }, hasConflict: false },
      { event: makeEvent({ executionId: 2 }), placement: { startSlot: 4, spanSlots: 4, laneRow: 1 }, hasConflict: false },
    ];
    const packed = packRows(items);
    expect(packed[0].placement.laneRow).toBe(1);
    expect(packed[1].placement.laneRow).toBe(1);
  });

  it('places overlapping events on different rows', () => {
    const items = [
      { event: makeEvent({ executionId: 1 }), placement: { startSlot: 0, spanSlots: 8, laneRow: 1 }, hasConflict: false },
      { event: makeEvent({ executionId: 2 }), placement: { startSlot: 2, spanSlots: 6, laneRow: 1 }, hasConflict: false },
    ];
    const packed = packRows(items);
    expect(packed[0].placement.laneRow).toBe(1);
    expect(packed[1].placement.laneRow).toBe(2);
  });

  it('sorts by startSlot then by spanSlots', () => {
    const items = [
      { event: makeEvent({ executionId: 1 }), placement: { startSlot: 5, spanSlots: 2, laneRow: 1 }, hasConflict: false },
      { event: makeEvent({ executionId: 2 }), placement: { startSlot: 0, spanSlots: 8, laneRow: 1 }, hasConflict: false },
      { event: makeEvent({ executionId: 3 }), placement: { startSlot: 0, spanSlots: 4, laneRow: 1 }, hasConflict: false },
    ];
    const packed = packRows(items);
    expect(packed[0].event.executionId).toBe(3);
    expect(packed[1].event.executionId).toBe(2);
    expect(packed[2].event.executionId).toBe(1);
  });
});

describe('buildLanesForRange — operator lane', () => {
  it('puts an event with no assignments into op-none', () => {
    const lanes = buildLanesForRange({
      events: [makeEvent({ assignments: [] })],
      conflicts: [],
      lane: 'operators',
      days: ['2026-04-15'],
    });
    const noneLane = lanes.find((l) => l.id === 'op-none');
    expect(noneLane).toBeDefined();
    expect(noneLane!.label).toBe('Sem operador');
    expect(noneLane!.events).toHaveLength(1);
  });

  it('groups events under each operator assignment', () => {
    const ev = makeEvent({
      assignments: [
        { teamMemberId: 7, teamMemberName: 'Maria', machineId: null, machineName: null },
        { teamMemberId: 9, teamMemberName: 'Pedro', machineId: null, machineName: null },
      ],
    });
    const lanes = buildLanesForRange({
      events: [ev],
      conflicts: [],
      lane: 'operators',
      days: ['2026-04-15'],
    });
    expect(lanes.map((l) => l.id).sort()).toEqual(['op-7', 'op-9']);
  });

  it('marks events with hasConflict=true when in conflict set', () => {
    const ev = makeEvent({
      executionId: 42,
      assignments: [{ teamMemberId: 1, teamMemberName: 'X', machineId: null, machineName: null }],
    });
    const conflicts: ConflictResponse[] = [
      {
        date: '2026-04-15',
        resourceType: 'TEAM_MEMBER',
        resourceId: 1,
        resourceName: 'X',
        conflictingEvents: [{ executionId: 42, requestTitle: 'X' }],
      },
    ];
    const lanes = buildLanesForRange({
      events: [ev],
      conflicts,
      lane: 'operators',
      days: ['2026-04-15'],
    });
    expect(lanes[0].events[0].hasConflict).toBe(true);
  });
});

describe('buildLanesForRange — machine lane', () => {
  it('ignores assignments without machineId', () => {
    const ev = makeEvent({
      assignments: [{ teamMemberId: 1, teamMemberName: 'X', machineId: null, machineName: null }],
    });
    const lanes = buildLanesForRange({
      events: [ev],
      conflicts: [],
      lane: 'machines',
      days: ['2026-04-15'],
    });
    expect(lanes).toHaveLength(0);
  });

  it('groups events by machineId, using machineName when present', () => {
    const ev = makeEvent({
      assignments: [{ teamMemberId: 1, teamMemberName: 'X', machineId: 5, machineName: 'Trator JD' }],
    });
    const lanes = buildLanesForRange({
      events: [ev],
      conflicts: [],
      lane: 'machines',
      days: ['2026-04-15'],
    });
    expect(lanes[0].id).toBe('m-5');
    expect(lanes[0].label).toBe('Trator JD');
  });

  it('falls back to "Máquina #ID" when machineName is null', () => {
    const ev = makeEvent({
      assignments: [{ teamMemberId: 1, teamMemberName: 'X', machineId: 5, machineName: null }],
    });
    const lanes = buildLanesForRange({
      events: [ev],
      conflicts: [],
      lane: 'machines',
      days: ['2026-04-15'],
    });
    expect(lanes[0].label).toBe('Máquina #5');
  });
});

describe('buildLanesForRange — job lane', () => {
  it('creates one lane per execution', () => {
    const ev1 = makeEvent({ executionId: 1, requestTitle: 'Job A' });
    const ev2 = makeEvent({ executionId: 2, requestTitle: 'Job B' });
    const lanes = buildLanesForRange({
      events: [ev1, ev2],
      conflicts: [],
      lane: 'jobs',
      days: ['2026-04-15'],
    });
    expect(lanes.map((l) => l.id).sort()).toEqual(['job-1', 'job-2']);
    expect(lanes.find((l) => l.id === 'job-1')!.label).toBe('Job A');
  });
});

describe('buildLanesForRange — empty cases & sorting', () => {
  it('returns empty array when there are no events', () => {
    expect(
      buildLanesForRange({
        events: [],
        conflicts: [],
        lane: 'operators',
        days: ['2026-04-15'],
      }),
    ).toEqual([]);
  });

  it('skips events whose placement returns null (all-day)', () => {
    const lanes = buildLanesForRange({
      events: [makeEvent({ scheduledAllDay: true })],
      conflicts: [],
      lane: 'jobs',
      days: ['2026-04-15'],
    });
    expect(lanes).toEqual([]);
  });

  it('returns lanes sorted by label', () => {
    const evA = makeEvent({
      executionId: 1,
      assignments: [{ teamMemberId: 1, teamMemberName: 'Bruno', machineId: null, machineName: null }],
    });
    const evB = makeEvent({
      executionId: 2,
      assignments: [{ teamMemberId: 2, teamMemberName: 'Alice', machineId: null, machineName: null }],
    });
    const lanes = buildLanesForRange({
      events: [evA, evB],
      conflicts: [],
      lane: 'operators',
      days: ['2026-04-15'],
    });
    expect(lanes.map((l) => l.label)).toEqual(['Alice', 'Bruno']);
  });
});
