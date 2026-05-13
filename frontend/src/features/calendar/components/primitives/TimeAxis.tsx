import { cn } from '@/utils/cn';
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  SLOTS_PER_DAY,
  SLOTS_PER_HOUR,
  formatHourLabel,
} from '../../utils/timeMath';

interface TimeAxisProps {
  days?: number;
  className?: string;
  showDayLabels?: boolean;
  dayLabels?: string[];
}

export function TimeAxis({
  days = 1,
  className,
  showDayLabels = false,
  dayLabels,
}: TimeAxisProps) {
  const slotsTotal = SLOTS_PER_DAY * days;
  const hoursPerDay = DAY_END_HOUR - DAY_START_HOUR;

  return (
    <div className={cn('flex flex-col select-none', className)}>
      {showDayLabels && (
        <div
          className="grid border-b border-neutral-200 bg-neutral-50"
          style={{ gridTemplateColumns: `repeat(${days}, 1fr)` }}
        >
          {Array.from({ length: days }).map((_, dayIdx) => (
            <div
              key={dayIdx}
              className={cn(
                'px-2 py-1.5 text-xs font-semibold text-neutral-700',
                dayIdx > 0 && 'border-l border-neutral-200',
              )}
            >
              {dayLabels?.[dayIdx] ?? `Dia ${dayIdx + 1}`}
            </div>
          ))}
        </div>
      )}

      <div
        className="relative grid h-7 border-b border-neutral-200 bg-neutral-50"
        style={{ gridTemplateColumns: `repeat(${slotsTotal}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: days }).map((_, dayIdx) => (
          <div
            key={`hours-${dayIdx}`}
            className={cn(
              'absolute inset-y-0 grid',
              dayIdx > 0 && 'border-l border-neutral-300',
            )}
            style={{
              left: `${(dayIdx / days) * 100}%`,
              width: `${100 / days}%`,
              gridTemplateColumns: `repeat(${hoursPerDay}, 1fr)`,
            }}
          >
            {Array.from({ length: hoursPerDay }).map((_, hourIdx) => (
              <div
                key={hourIdx}
                className={cn(
                  'flex items-center justify-start px-1 text-[10px] font-medium text-neutral-500',
                  hourIdx > 0 && 'border-l border-neutral-200',
                )}
              >
                {formatHourLabel(DAY_START_HOUR + hourIdx)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimeGridBackgroundProps {
  days?: number;
  className?: string;
}

export function TimeGridBackground({ days = 1, className }: TimeGridBackgroundProps) {
  const hoursPerDay = DAY_END_HOUR - DAY_START_HOUR;
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 grid', className)}
      style={{ gridTemplateColumns: `repeat(${days}, 1fr)` }}
      aria-hidden
    >
      {Array.from({ length: days }).map((_, dayIdx) => (
        <div
          key={dayIdx}
          className={cn('grid', dayIdx > 0 && 'border-l border-neutral-300')}
          style={{ gridTemplateColumns: `repeat(${hoursPerDay * SLOTS_PER_HOUR}, 1fr)` }}
        >
          {Array.from({ length: hoursPerDay * SLOTS_PER_HOUR }).map((_, slotIdx) => {
            const isHour = slotIdx % SLOTS_PER_HOUR === 0;
            return (
              <div
                key={slotIdx}
                className={cn(
                  'h-full',
                  slotIdx > 0 && (isHour ? 'border-l border-neutral-200' : 'border-l border-neutral-100'),
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
