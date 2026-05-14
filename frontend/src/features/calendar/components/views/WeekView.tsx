import { useMemo } from 'react';
import { User, Wrench, Briefcase } from 'lucide-react';
import type { CalendarEvent, CalendarLane, ConflictResponse } from '@/types/calendar';
import { TimeAxis } from '../primitives/TimeAxis';
import { ResourceLane } from '../primitives/ResourceLane';
import { GanttBarV2 } from '../primitives/GanttBarV2';
import { AllDayBand } from '../primitives/AllDayBand';
import { DraggableBar } from '../dnd/DraggableBar';
import { DroppableLane } from '../dnd/DroppableLane';
import { buildLanesForRange } from '../../utils/laneBuilders';
import { SLOTS_PER_DAY } from '../../utils/timeMath';
import { formatDayHeader } from '../../utils/viewRange';

interface WeekViewProps {
  readonly events: CalendarEvent[];
  readonly conflicts: ConflictResponse[];
  readonly days: string[];
  readonly lane: CalendarLane;
  readonly onEventClick?: (event: CalendarEvent) => void;
  readonly emptyState?: React.ReactNode;
  readonly enableDnd?: boolean;
}

const LANE_ICON = {
  operators: User,
  machines: Wrench,
  jobs: Briefcase,
} as const;

export function WeekView({
  events,
  conflicts,
  days,
  lane,
  onEventClick,
  emptyState,
  enableDnd = false,
}: WeekViewProps) {
  const lanes = useMemo(
    () => buildLanesForRange({ events, conflicts, lane, days }),
    [events, conflicts, lane, days],
  );

  const Icon = LANE_ICON[lane];

  const dayLabels = useMemo(() => days.map(formatDayHeader), [days]);

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex border-b border-neutral-200">
        <div className="w-44 flex-shrink-0 border-r border-neutral-200 bg-neutral-50" />
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[1200px]">
            <TimeAxis days={days.length} showDayLabels dayLabels={dayLabels} />
          </div>
        </div>
      </div>

      <AllDayBand
        events={events}
        days={days.length}
        dayLabels={days}
        onEventClick={onEventClick}
      />

      {lanes.length === 0 && (
        <div className="px-6 py-10 text-center text-sm text-neutral-500">
          {emptyState ?? 'Sem eventos para esta semana.'}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {lanes.map((group) => {
            const bars = group.events.map((laneEvent) => {
              const dayIndex = Math.floor(laneEvent.placement.startSlot / SLOTS_PER_DAY);
              const dayIso = days[Math.min(dayIndex, days.length - 1)] ?? days[0];
              return enableDnd ? (
                <DraggableBar
                  key={`${group.id}-${laneEvent.event.executionId}-${laneEvent.placement.startSlot}`}
                  event={laneEvent.event}
                  startSlot={laneEvent.placement.startSlot}
                  spanSlots={laneEvent.placement.spanSlots}
                  laneRow={laneEvent.placement.laneRow}
                  hasConflict={laneEvent.hasConflict}
                  laneId={group.id}
                  resourceType={group.resourceType}
                  resourceId={group.resourceId}
                  dayIso={dayIso}
                  onClick={(e) => onEventClick?.(e)}
                />
              ) : (
                <GanttBarV2
                  key={`${group.id}-${laneEvent.event.executionId}-${laneEvent.placement.startSlot}`}
                  event={laneEvent.event}
                  startSlot={laneEvent.placement.startSlot}
                  spanSlots={laneEvent.placement.spanSlots}
                  laneRow={laneEvent.placement.laneRow}
                  hasConflict={laneEvent.hasConflict}
                  onClick={(e) => onEventClick?.(e)}
                  showResizeHandles={false}
                />
              );
            });
            return enableDnd ? (
              <DroppableLane
                key={group.id}
                laneId={group.id}
                resourceType={group.resourceType}
                resourceId={group.resourceId}
                days={days}
                label={group.label}
                sublabel={group.sublabel}
                icon={<Icon className="h-4 w-4" />}
                rowsCount={group.rowsCount}
              >
                {bars}
              </DroppableLane>
            ) : (
              <ResourceLane
                key={group.id}
                label={group.label}
                sublabel={group.sublabel}
                icon={<Icon className="h-4 w-4" />}
                days={days.length}
                rowsCount={group.rowsCount}
              >
                {bars}
              </ResourceLane>
            );
          })}
        </div>
      </div>
    </div>
  );
}
