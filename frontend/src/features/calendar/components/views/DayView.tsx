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
import { DAY_END_HOUR, DAY_START_HOUR } from '../../utils/timeMath';

interface DayViewProps {
  readonly events: CalendarEvent[];
  readonly conflicts: ConflictResponse[];
  readonly dayIso: string;
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

export function DayView({
  events,
  conflicts,
  dayIso,
  lane,
  onEventClick,
  emptyState,
  enableDnd = false,
}: DayViewProps) {
  const lanes = useMemo(
    () => buildLanesForRange({ events, conflicts, lane, days: [dayIso] }),
    [events, conflicts, lane, dayIso],
  );

  const Icon = LANE_ICON[lane];

  const isToday = dayIso === todayIso();
  const nowPercent = isToday ? computeNowPercent() : null;

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex border-b border-neutral-200">
        <div className="w-44 flex-shrink-0 border-r border-neutral-200 bg-neutral-50" />
        <div className="flex-1">
          <TimeAxis days={1} />
        </div>
      </div>

      <AllDayBand events={events} days={1} dayLabels={[dayIso]} onEventClick={onEventClick} />

      {lanes.length === 0 && (
        <div className="px-6 py-10 text-center text-sm text-neutral-500">
          {emptyState ?? 'Sem eventos para este dia.'}
        </div>
      )}

      <div className="relative">
        {nowPercent !== null && (
          <div
            className="pointer-events-none absolute inset-y-0 z-30 border-l-2 border-danger-500"
            style={{ left: `calc(11rem + (${nowPercent}% * (100% - 11rem) / 100))` }}
            aria-label="Hora atual"
          >
            <span className="absolute -top-1 -translate-x-1/2 rounded bg-danger-500 px-1 py-0.5 text-[10px] font-semibold text-white">
              agora
            </span>
          </div>
        )}

        {lanes.map((group) => {
          const bars = group.events.map((laneEvent) =>
            enableDnd ? (
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
            ),
          );
          return enableDnd ? (
            <DroppableLane
              key={group.id}
              laneId={group.id}
              resourceType={group.resourceType}
              resourceId={group.resourceId}
              days={[dayIso]}
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
              days={1}
              rowsCount={group.rowsCount}
            >
              {bars}
            </ResourceLane>
          );
        })}
      </div>
    </div>
  );
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeNowPercent(): number | null {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = DAY_START_HOUR * 60;
  const endMinutes = DAY_END_HOUR * 60;
  if (minutes < startMinutes || minutes > endMinutes) return null;
  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  return ((minutes - startMinutes) / totalMinutes) * 100;
}

