import { describe, it, expect } from 'vitest';
import type { CalendarEvent } from '@/types/calendar';
import { eventsConflict, describeProposedTime } from '../conflictCheck';

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    executionId: 100,
    requestId: 1,
    requestTitle: 'Outro trabalho',
    categoryName: 'Solo',
    scheduledDate: '2026-05-20',
    scheduledEndDate: '2026-05-20',
    scheduledStartTime: '08:00',
    scheduledEndTime: '11:00',
    scheduledAllDay: false,
    status: 'IN_PROGRESS',
    island: 'Terceira',
    parish: 'Angra',
    urgency: 'MEDIUM',
    assignments: [{ teamMemberId: 7, teamMemberName: 'A', machineId: 12, machineName: 'M' }],
    ...overrides,
  };
}

describe('eventsConflict', () => {
  it('returns no conflict when no resources are shared', () => {
    const others = [event()];
    const result = eventsConflict(
      {
        executionId: 1,
        dayIso: '2026-05-20',
        startSlot: 4,
        spanSlots: 4,
        operatorIds: [99],
        machineIds: [99],
      },
      others,
    );
    expect(result.conflict).toBe(false);
  });

  it('detects time overlap when operator is shared', () => {
    const others = [event({ scheduledStartTime: '08:00', scheduledEndTime: '11:00' })];
    const result = eventsConflict(
      {
        executionId: 1,
        dayIso: '2026-05-20',
        startSlot: 6, // 09:00 — 06:00 + 6*30min
        spanSlots: 2, // 1h
        operatorIds: [7],
        machineIds: [],
      },
      others,
    );
    expect(result.conflict).toBe(true);
    expect(result.reason).toContain('Outro trabalho');
  });

  it('detects time overlap when machine is shared', () => {
    const others = [event({ scheduledStartTime: '10:00', scheduledEndTime: '12:00' })];
    const result = eventsConflict(
      {
        executionId: 1,
        dayIso: '2026-05-20',
        startSlot: 10, // 11:00
        spanSlots: 2, // 1h
        operatorIds: [],
        machineIds: [12],
      },
      others,
    );
    expect(result.conflict).toBe(true);
  });

  it('ignores events on different dates', () => {
    const others = [event({ scheduledDate: '2026-05-21', scheduledEndDate: '2026-05-21' })];
    const result = eventsConflict(
      {
        executionId: 1,
        dayIso: '2026-05-20',
        startSlot: 6,
        spanSlots: 2,
        operatorIds: [7],
        machineIds: [],
      },
      others,
    );
    expect(result.conflict).toBe(false);
  });

  it('flags conflict for all-day events on the same date', () => {
    const others = [event({ scheduledAllDay: true })];
    const result = eventsConflict(
      {
        executionId: 1,
        dayIso: '2026-05-20',
        startSlot: 6,
        spanSlots: 2,
        operatorIds: [7],
        machineIds: [],
      },
      others,
    );
    expect(result.conflict).toBe(true);
    expect(result.reason).toContain('dia inteiro');
  });

  it('skips self-comparisons by executionId', () => {
    const self = event({ executionId: 42 });
    const result = eventsConflict(
      {
        executionId: 42,
        dayIso: '2026-05-20',
        startSlot: 4,
        spanSlots: 6,
        operatorIds: [7],
        machineIds: [12],
      },
      [self],
    );
    expect(result.conflict).toBe(false);
  });

  it('returns no conflict when windows do not overlap', () => {
    const others = [event({ scheduledStartTime: '08:00', scheduledEndTime: '10:00' })];
    const result = eventsConflict(
      {
        executionId: 1,
        dayIso: '2026-05-20',
        startSlot: 8, // 10:00
        spanSlots: 4, // 12:00
        operatorIds: [7],
        machineIds: [],
      },
      others,
    );
    expect(result.conflict).toBe(false);
  });
});

describe('describeProposedTime', () => {
  it('formats the proposed window as HH:MM–HH:MM', () => {
    expect(describeProposedTime(4, 4)).toBe('08:00–10:00');
  });
});
