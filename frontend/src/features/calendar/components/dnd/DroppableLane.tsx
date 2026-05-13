import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ResourceLane } from '../primitives/ResourceLane';

interface DroppableLaneProps {
  laneId: string;
  resourceType: 'operator' | 'machine' | 'job';
  resourceId: number | null;
  days: string[];
  label: string;
  sublabel?: string;
  icon?: ReactNode;
  rowsCount?: number;
  children?: ReactNode;
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
    id: `lane:${laneId}`,
    data: {
      type: 'lane',
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
