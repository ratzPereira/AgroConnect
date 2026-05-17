export interface Interval {
  start: number;
  end: number;
}

export interface LanePlacement {
  laneIndex: number;
  laneCount: number;
}

/**
 * First-fit lane packing for half-open intervals [start, end).
 * Returns lane assignment + total lanes used in each item's overlap group.
 * Stable: result order matches input order; indices are 0-based.
 */
export function packIntervals<T extends Interval>(items: T[]): Array<T & LanePlacement> {
  const indexed = items.map((item, originalIndex) => ({ item, originalIndex, laneIndex: -1 }));
  indexed.sort((a, b) => a.item.start - b.item.start || a.item.end - b.item.end);

  const laneEnds: number[] = [];
  for (const slot of indexed) {
    let placed = false;
    for (let lane = 0; lane < laneEnds.length; lane++) {
      if (laneEnds[lane] <= slot.item.start) {
        slot.laneIndex = lane;
        laneEnds[lane] = slot.item.end;
        placed = true;
        break;
      }
    }
    if (!placed) {
      slot.laneIndex = laneEnds.length;
      laneEnds.push(slot.item.end);
    }
  }

  const result: Array<T & LanePlacement> = new Array(items.length);
  for (const slot of indexed) {
    let maxLane = slot.laneIndex;
    for (const other of indexed) {
      if (other === slot) continue;
      if (other.item.start < slot.item.end && other.item.end > slot.item.start) {
        if (other.laneIndex > maxLane) maxLane = other.laneIndex;
      }
    }
    result[slot.originalIndex] = {
      ...slot.item,
      laneIndex: slot.laneIndex,
      laneCount: maxLane + 1,
    };
  }
  return result;
}
