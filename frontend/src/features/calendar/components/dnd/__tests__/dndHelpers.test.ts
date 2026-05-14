import { describe, it, expect } from 'vitest';
import {
  findLaneAtPoint,
  decodeLaneId,
  parseHHMM,
  computeSessionSpan,
  extractDaysCount,
  extractDays,
} from '../dndHelpers';
import type { CalendarEvent } from '@/types/calendar';
import type { DragSession } from '../../../hooks/useDragReschedule';

function makeSession(start: string | null, end: string | null): DragSession {
  const event = {
    executionId: 1,
    requestId: 1,
    requestTitle: 'Test',
    scheduledDate: '2026-04-15',
    scheduledEndDate: '2026-04-15',
    scheduledStartTime: start,
    scheduledEndTime: end,
    scheduledAllDay: false,
    status: 'IN_PROGRESS',
    urgency: 'MEDIUM',
    assignments: [],
  } as unknown as CalendarEvent;
  return {
    event,
    laneId: 'op-1',
    resourceType: 'operator',
    resourceId: 1,
  };
}

describe('decodeLaneId', () => {
  it('decodes op-none as operator with null id', () => {
    expect(decodeLaneId('op-none')).toEqual({ resourceType: 'operator', resourceId: null });
  });

  it('decodes op-42 as operator with id 42', () => {
    expect(decodeLaneId('op-42')).toEqual({ resourceType: 'operator', resourceId: 42 });
  });

  it('decodes op-abc as operator with null id (NaN slice)', () => {
    expect(decodeLaneId('op-abc')).toEqual({ resourceType: 'operator', resourceId: null });
  });

  it('decodes m-7 as machine with id 7', () => {
    expect(decodeLaneId('m-7')).toEqual({ resourceType: 'machine', resourceId: 7 });
  });

  it('decodes m-xx as machine with null id (NaN)', () => {
    expect(decodeLaneId('m-xx')).toEqual({ resourceType: 'machine', resourceId: null });
  });

  it('decodes job-99 as job with id 99', () => {
    expect(decodeLaneId('job-99')).toEqual({ resourceType: 'job', resourceId: 99 });
  });

  it('decodes job-foo as job with null id (NaN)', () => {
    expect(decodeLaneId('job-foo')).toEqual({ resourceType: 'job', resourceId: null });
  });

  it('falls back to operator/null for unknown prefix', () => {
    expect(decodeLaneId('weird')).toEqual({ resourceType: 'operator', resourceId: null });
  });
});

describe('parseHHMM', () => {
  it('returns null for nullish input', () => {
    expect(parseHHMM(null)).toBeNull();
    expect(parseHHMM(undefined)).toBeNull();
    expect(parseHHMM('')).toBeNull();
  });

  it('parses 06:00 as 0 minutes from start of day (06h base)', () => {
    expect(parseHHMM('06:00')).toBe(0);
  });

  it('parses 09:00 as 180 minutes', () => {
    expect(parseHHMM('09:00')).toBe(180);
  });

  it('parses 09:30 as 210 minutes', () => {
    expect(parseHHMM('09:30')).toBe(210);
  });

  it('returns null for malformed input', () => {
    expect(parseHHMM('abc')).toBeNull();
    expect(parseHHMM('09:xx')).toBeNull();
  });
});

describe('computeSessionSpan', () => {
  it('returns 2 (1h default) when start is missing', () => {
    expect(computeSessionSpan(makeSession(null, '12:00'))).toBe(2);
  });

  it('returns 2 when end is missing', () => {
    expect(computeSessionSpan(makeSession('09:00', null))).toBe(2);
  });

  it('computes 6 slots for a 3-hour session (09:00-12:00)', () => {
    expect(computeSessionSpan(makeSession('09:00', '12:00'))).toBe(6);
  });

  it('computes 1 slot for a 30-min session', () => {
    expect(computeSessionSpan(makeSession('09:00', '09:30'))).toBe(1);
  });

  it('returns at least 1 slot for zero-duration session', () => {
    expect(computeSessionSpan(makeSession('09:00', '09:00'))).toBe(1);
  });
});

describe('extractDaysCount', () => {
  it('returns 1 when data-days-count is missing', () => {
    const el = document.createElement('div');
    expect(extractDaysCount(el)).toBe(1);
  });

  it('returns the value when data-days-count is a positive number', () => {
    const el = document.createElement('div');
    el.dataset.daysCount = '5';
    expect(extractDaysCount(el)).toBe(5);
  });

  it('returns 1 when data-days-count is non-numeric', () => {
    const el = document.createElement('div');
    el.dataset.daysCount = 'abc';
    expect(extractDaysCount(el)).toBe(1);
  });

  it('returns 1 when data-days-count is zero or negative', () => {
    const el = document.createElement('div');
    el.dataset.daysCount = '0';
    expect(extractDaysCount(el)).toBe(1);
    el.dataset.daysCount = '-3';
    expect(extractDaysCount(el)).toBe(1);
  });
});

describe('extractDays', () => {
  it('returns [] when data-days is missing', () => {
    const el = document.createElement('div');
    expect(extractDays(el)).toEqual([]);
  });

  it('parses a comma-separated list', () => {
    const el = document.createElement('div');
    el.dataset.days = '2026-04-15,2026-04-16,2026-04-17';
    expect(extractDays(el)).toEqual(['2026-04-15', '2026-04-16', '2026-04-17']);
  });

  it('returns single-element array for a single date', () => {
    const el = document.createElement('div');
    el.dataset.days = '2026-04-15';
    expect(extractDays(el)).toEqual(['2026-04-15']);
  });
});

describe('findLaneAtPoint', () => {
  it('returns null when no lane element is under the point', () => {
    const originalElementsFromPoint = document.elementsFromPoint;
    document.elementsFromPoint = () => [];
    try {
      expect(findLaneAtPoint(-1, -1)).toBeNull();
    } finally {
      document.elementsFromPoint = originalElementsFromPoint;
    }
  });

  it('returns null when no element in the stack carries a lane id', () => {
    const plain = document.createElement('div');
    const originalElementsFromPoint = document.elementsFromPoint;
    document.elementsFromPoint = () => [plain];
    try {
      expect(findLaneAtPoint(0, 0)).toBeNull();
    } finally {
      document.elementsFromPoint = originalElementsFromPoint;
    }
  });

  it('returns lane info when a lane element is under the point', () => {
    const lane = document.createElement('div');
    lane.dataset.laneId = 'op-7';
    Object.defineProperty(lane, 'getBoundingClientRect', {
      value: () => ({
        x: 10,
        y: 10,
        width: 100,
        height: 50,
        top: 10,
        right: 110,
        bottom: 60,
        left: 10,
        toJSON: () => ({}),
      }),
    });
    const originalElementsFromPoint = document.elementsFromPoint;
    document.elementsFromPoint = () => [lane];
    try {
      const hit = findLaneAtPoint(50, 30);
      expect(hit).not.toBeNull();
      expect(hit?.laneId).toBe('op-7');
      expect(hit?.el).toBe(lane);
    } finally {
      document.elementsFromPoint = originalElementsFromPoint;
    }
  });

  it('walks the element stack and picks the first element with a lane id', () => {
    const child = document.createElement('div');
    const lane = document.createElement('div');
    lane.dataset.laneId = 'm-3';
    Object.defineProperty(lane, 'getBoundingClientRect', {
      value: () => ({
        x: 0, y: 0, width: 1, height: 1, top: 0, right: 1, bottom: 1, left: 0,
        toJSON: () => ({}),
      }),
    });
    const originalElementsFromPoint = document.elementsFromPoint;
    document.elementsFromPoint = () => [child, lane];
    try {
      const hit = findLaneAtPoint(0, 0);
      expect(hit?.laneId).toBe('m-3');
    } finally {
      document.elementsFromPoint = originalElementsFromPoint;
    }
  });
});
