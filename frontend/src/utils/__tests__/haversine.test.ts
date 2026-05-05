import { describe, it, expect } from 'vitest';
import { haversineDistance, formatDistance } from '../haversine';

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    const distance = haversineDistance(38.6667, -27.2167, 38.6667, -27.2167);
    expect(distance).toBe(0);
  });

  it('calculates known distance between Angra do Heroismo and Ponta Delgada (~130km)', () => {
    // Angra do Heroísmo: 38.6553, -27.2172
    // Ponta Delgada: 37.7483, -25.6666
    const distance = haversineDistance(38.6553, -27.2172, 37.7483, -25.6666);
    const km = distance / 1000;
    expect(km).toBeGreaterThan(120);
    expect(km).toBeLessThan(180);
  });

  it('is symmetric (a→b equals b→a)', () => {
    const d1 = haversineDistance(38.6553, -27.2172, 37.7483, -25.6666);
    const d2 = haversineDistance(37.7483, -25.6666, 38.6553, -27.2172);
    expect(d1).toBeCloseTo(d2, 6);
  });

  it('calculates approximately half the earth circumference for antipodal points', () => {
    // North pole to south pole
    const distance = haversineDistance(90, 0, -90, 0);
    const km = distance / 1000;
    // Half circumference ~20015km
    expect(km).toBeGreaterThan(19900);
    expect(km).toBeLessThan(20100);
  });
});

describe('formatDistance', () => {
  it('formats distance under 1000m as meters', () => {
    expect(formatDistance(500)).toBe('500m');
  });

  it('formats exactly 1000m as km', () => {
    expect(formatDistance(1000)).toBe('1.0km');
  });

  it('formats distance over 1km with one decimal', () => {
    expect(formatDistance(5500)).toBe('5.5km');
  });

  it('formats 0 meters as 0m', () => {
    expect(formatDistance(0)).toBe('0m');
  });
});
