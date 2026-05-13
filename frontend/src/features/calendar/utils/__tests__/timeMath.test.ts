import { describe, expect, it } from 'vitest';
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  SLOTS_PER_DAY,
  buildHourTicks,
  clampSlot,
  formatHourLabel,
  formatTime,
  minutesBetween,
  parseTime,
  slotToTime,
  snapSlot,
  timeToSlot,
} from '../timeMath';

describe('timeMath', () => {
  it('exposes the right day boundary constants', () => {
    expect(DAY_START_HOUR).toBe(6);
    expect(DAY_END_HOUR).toBe(20);
    expect(SLOTS_PER_DAY).toBe(28);
  });

  it('parses HH:mm strings', () => {
    expect(parseTime('06:00')).toEqual({ hour: 6, minute: 0 });
    expect(parseTime('17:30')).toEqual({ hour: 17, minute: 30 });
    expect(parseTime(null)).toBeNull();
    expect(parseTime(undefined)).toBeNull();
  });

  it('parses ISO LocalTime with seconds gracefully', () => {
    expect(parseTime('09:15:00')).toEqual({ hour: 9, minute: 15 });
  });

  it('formats a time back to HH:mm', () => {
    expect(formatTime({ hour: 9, minute: 5 })).toBe('09:05');
    expect(formatTime(null)).toBe('');
  });

  it('converts between time and slot index', () => {
    expect(timeToSlot({ hour: 6, minute: 0 })).toBe(0);
    expect(timeToSlot({ hour: 6, minute: 30 })).toBe(1);
    expect(timeToSlot({ hour: 12, minute: 0 })).toBe(12);
    expect(timeToSlot({ hour: 19, minute: 30 })).toBe(27);
    expect(slotToTime(0)).toEqual({ hour: 6, minute: 0 });
    expect(slotToTime(27)).toEqual({ hour: 19, minute: 30 });
    expect(slotToTime(28)).toEqual({ hour: 20, minute: 0 });
  });

  it('clamps slots to valid range', () => {
    expect(clampSlot(-5)).toBe(0);
    expect(clampSlot(500)).toBe(SLOTS_PER_DAY);
    expect(snapSlot(3.4)).toBe(3);
    expect(snapSlot(3.6)).toBe(4);
  });

  it('computes minutes between two times', () => {
    expect(minutesBetween({ hour: 9, minute: 0 }, { hour: 12, minute: 30 })).toBe(210);
  });

  it('produces hour ticks 06..20 inclusive', () => {
    const ticks = buildHourTicks();
    expect(ticks[0]).toBe(6);
    expect(ticks[ticks.length - 1]).toBe(20);
    expect(ticks).toHaveLength(15);
  });

  it('formats hour labels with leading zero', () => {
    expect(formatHourLabel(6)).toBe('06:00');
    expect(formatHourLabel(13)).toBe('13:00');
  });
});
