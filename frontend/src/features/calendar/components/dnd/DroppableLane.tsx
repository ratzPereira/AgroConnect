import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ResourceLane } from '../primitives/ResourceLane';
import { DND_LANE } from './dndTypes';

interface DroppableLaneProps {
  readonly laneId: string;
  readonly resourceType: 'operator' | 'machine' | 'job';
  readonly resourceId: number | null;
  readonly days: string[];
  readonly label: string;
  readonly sublabel?: string;
  readonly icon?: ReactNode;
  readonly rowsCount?: number;
  readonly children?: ReactNode;
}

export function DroppableLane({
  laneId,
  resourceType,
  resourceId,
  days,
  label,
  sublabel,
  icon,
  rowsCount,
  children,
}: DroppableLaneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${DND_LANE}:${laneId}`,
    data: {
      type: DND_LANE,
      laneId,
      resourceType,
      resourceId,
      days,
    },
  });

  return (
    <ResourceLane
      label={label}
      sublabel={sublabel}
      icon={icon}
      days={days.length}
      rowsCount={rowsCount}
      dropRef={setNodeRef}
      isDropActive={isOver}
      data-lane-id={laneId}
      data-days={days.join(',')}
      data-days-count={days.length}
    >
      {children}
    </ResourceLane>
  );
}
