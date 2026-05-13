import { describe, expect, it } from 'vitest';
import {
  addDays,
  endOfMonth,
  formatDayHeader,
  isoDate,
  parseIsoDate,
  rangeForView,
  startOfMonth,
  startOfWeek,
} from '../viewRange';

describe('viewRange', () => {
  it('round-trips iso ↔ Date', () => {
    expect(isoDate(parseIsoDate('2026-04-15'))).toBe('2026-04-15');
  });

  it('addDays adds across month boundary', () => {
    expect(addDays('2026-04-30', 1)).toBe('2026-05-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('startOfWeek anchors to Monday (Portuguese week)', () => {
    expect(startOfWeek('2026-04-15')).toBe('2026-04-13');
    expect(startOfWeek('2026-04-13')).toBe('2026-04-13');
    expect(startOfWeek('2026-04-19')).toBe('2026-04-13');
  });

  it('startOfMonth / endOfMonth bound the month', () => {
    expect(startOfMonth('2026-04-15')).toBe('2026-04-01');
    expect(endOfMonth('2026-04-15')).toBe('2026-04-30');
    expect(endOfMonth('2026-02-15')).toBe('2026-02-28');
  });

  it('rangeForView day returns a single day', () => {
    const r = rangeForView('day', '2026-04-15');
    expect(r.from).toBe('2026-04-15');
    expect(r.to).toBe('2026-04-15');
    expect(r.days).toHaveLength(1);
  });

  it('rangeForView week returns 7 days starting Monday', () => {
    const r = rangeForView('week', '2026-04-15');
    expect(r.from).toBe('2026-04-13');
    expect(r.to).toBe('2026-04-19');
    expect(r.days).toHaveLength(7);
    expect(r.days[0]).toBe('2026-04-13');
  });

  it('rangeForView month returns full month', () => {
    const r = rangeForView('month', '2026-04-15');
    expect(r.from).toBe('2026-04-01');
    expect(r.to).toBe('2026-04-30');
    expect(r.days).toHaveLength(30);
  });

  it('formatDayHeader uses Portuguese weekday', () => {
    expect(formatDayHeader('2026-04-15')).toMatch(/qua 15\/4/);
  });
});
