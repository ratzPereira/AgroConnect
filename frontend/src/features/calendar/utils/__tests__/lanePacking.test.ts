import { describe, it, expect } from 'vitest';
import { packIntervals } from '../lanePacking';

describe('packIntervals', () => {
  it('returns empty output for empty input', () => {
    expect(packIntervals([])).toEqual([]);
  });

  it('places a single interval in lane 0 with laneCount 1', () => {
    const result = packIntervals([{ start: 0, end: 10 }]);
    expect(result).toHaveLength(1);
    expect(result[0].laneIndex).toBe(0);
    expect(result[0].laneCount).toBe(1);
  });

  it('places two overlapping intervals in lanes 0 and 1 with laneCount 2 each', () => {
    const result = packIntervals([
      { start: 0, end: 10 },
      { start: 5, end: 15 },
    ]);
    expect(result.map((r) => r.laneIndex)).toEqual([0, 1]);
    expect(result.map((r) => r.laneCount)).toEqual([2, 2]);
  });

  it('places two non-overlapping intervals both in lane 0 with laneCount 1', () => {
    const result = packIntervals([
      { start: 0, end: 5 },
      { start: 5, end: 10 },
    ]);
    expect(result.map((r) => r.laneIndex)).toEqual([0, 0]);
    expect(result.map((r) => r.laneCount)).toEqual([1, 1]);
  });

  it('packs A and C into the same lane when A overlaps B and B overlaps C but A and C are disjoint', () => {
    // A: [0, 5)  — does NOT overlap C
    // B: [3, 12) — overlaps both A and C
    // C: [10, 15)
    const result = packIntervals([
      { start: 0, end: 5 },
      { start: 3, end: 12 },
      { start: 10, end: 15 },
    ]);
    expect(result[0].laneIndex).toBe(0);
    expect(result[1].laneIndex).toBe(1);
    expect(result[2].laneIndex).toBe(0);
    expect(result[0].laneCount).toBe(2);
    expect(result[1].laneCount).toBe(2);
    expect(result[2].laneCount).toBe(2);
  });

  it('preserves input order in the returned array', () => {
    const items = [
      { start: 20, end: 25, id: 'a' },
      { start: 0, end: 5, id: 'b' },
      { start: 10, end: 15, id: 'c' },
    ];
    const result = packIntervals(items);
    expect(result.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('preserves extra fields on each item', () => {
    const result = packIntervals([{ start: 0, end: 5, label: 'X' }]);
    expect(result[0].label).toBe('X');
  });
});
