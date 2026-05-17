import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { cn } from '@/utils/cn';
import type { CalendarEvent } from '@/types/calendar';
import { WeekEventCard } from './WeekEventCard';
import { DraggableWeekEventCard } from './DraggableWeekEventCard';
import { WeekSlotDroppable } from './WeekSlotDroppable';
import { buildDayLayout, HOUR_HEIGHT_PX, DAY_TOTAL_HEIGHT_PX } from '../../utils/weekLayout';
import { DAY_START_HOUR, DAY_END_HOUR, SLOT_MINUTES } from '../../utils/timeMath';

const NOW_LINE_TICK_INTERVAL_MS = 60_000;

interface DayColumnProps {
  readonly dayIso: string;
  readonly events: CalendarEvent[];
  readonly conflictSet: Set<number>;
  readonly isToday: boolean;
  readonly onEventClick?: (event: CalendarEvent, mouse: MouseEvent<HTMLDivElement>) => void;
  readonly enableDnd?: boolean;
}

const SLOT_HEIGHT_PX = (HOUR_HEIGHT_PX * SLOT_MINUTES) / 60;

function computeNowTopPx(): number | null {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMin = DAY_START_HOUR * 60;
  const endMin = DAY_END_HOUR * 60;
  if (minutes < startMin || minutes > endMin) return null;
  return ((minutes - startMin) / 60) * HOUR_HEIGHT_PX;
}

function buildSlotMinutes(): number[] {
  const slots: number[] = [];
  for (let m = DAY_START_HOUR * 60; m < DAY_END_HOUR * 60; m += SLOT_MINUTES) {
    slots.push(m);
  }
  return slots;
}

export function DayColumn({
  dayIso,
  events,
  conflictSet,
  isToday,
  onEventClick,
  enableDnd = false,
}: DayColumnProps) {
  const layout = useMemo(
    () => buildDayLayout(events, dayIso, conflictSet),
    [events, dayIso, conflictSet],
  );
  const [, setNowTick] = useState(0);
  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(
      () => setNowTick((t) => t + 1),
      NOW_LINE_TICK_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [isToday]);
  const nowTopPx = isToday ? computeNowTopPx() : null;
  const hoursPerDay = DAY_END_HOUR - DAY_START_HOUR;
  const slotMinutes = useMemo(() => buildSlotMinutes(), []);

  return (
    <div
      className={cn('relative border-l border-neutral-200', isToday && 'bg-primary-50/30')}
      style={{ height: DAY_TOTAL_HEIGHT_PX }}
    >
      {Array.from({ length: hoursPerDay }).map((_, i) => (
        <div
          key={`line-${i}`}
          data-testid="hour-line"
          className="absolute inset-x-0 border-t border-neutral-100"
          style={{ top: i * HOUR_HEIGHT_PX }}
        />
      ))}
      {Array.from({ length: hoursPerDay }).map((_, i) => (
        <div
          key={`half-${i}`}
          className="absolute inset-x-0 border-t border-dashed border-neutral-100"
          style={{ top: i * HOUR_HEIGHT_PX + HOUR_HEIGHT_PX / 2 }}
        />
      ))}

      {enableDnd &&
        slotMinutes.map((slotMinute, idx) => (
          <WeekSlotDroppable
            key={`slot-${slotMinute}`}
            dayIso={dayIso}
            slotMinute={slotMinute}
            top={idx * SLOT_HEIGHT_PX}
            height={SLOT_HEIGHT_PX}
          />
        ))}

      {layout.map((item) =>
        enableDnd ? (
          <DraggableWeekEventCard
            key={item.event.executionId}
            event={item.event}
            top={item.top}
            height={item.height}
            laneIndex={item.laneIndex}
            laneCount={item.laneCount}
            hasConflict={item.hasConflict}
            dayIso={dayIso}
            onClick={onEventClick}
          />
        ) : (
          <WeekEventCard
            key={item.event.executionId}
            event={item.event}
            top={item.top}
            height={item.height}
            laneIndex={item.laneIndex}
            laneCount={item.laneCount}
            hasConflict={item.hasConflict}
            onClick={onEventClick}
          />
        ),
      )}

      {nowTopPx !== null && (
        <div
          data-testid="now-line"
          className="pointer-events-none absolute inset-x-0 z-30 border-t-2 border-danger-500"
          style={{ top: nowTopPx }}
        >
          <span className="absolute -top-2 -left-1 h-3 w-3 rounded-full bg-danger-500" />
        </div>
      )}
    </div>
  );
}
