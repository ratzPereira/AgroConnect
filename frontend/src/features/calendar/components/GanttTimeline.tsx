import { useMemo, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { GanttBarComponent } from './GanttBar';
import type { GanttRow } from '@/types/calendar';

interface GanttTimelineProps {
  readonly rows: GanttRow[];
  readonly year: number;
  readonly month: number;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

function dateToString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const BAR_HEIGHT = 34;
const BAR_GAP = 4;
const ROW_PADDING = 12;

export function GanttTimeline({ rows, year, month }: GanttTimelineProps) {
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayIndex = days.findIndex(isToday);

  // Auto-scroll to today on mount
  useEffect(() => {
    if (todayIndex >= 0 && scrollRef.current) {
      const dayWidth = scrollRef.current.scrollWidth / days.length;
      const scrollTo = dayWidth * todayIndex - scrollRef.current.clientWidth / 3;
      scrollRef.current.scrollLeft = Math.max(0, scrollTo);
    }
  }, [todayIndex, days.length]);

  const monthStart = dateToString(days[0]);
  const monthEnd = dateToString(days[days.length - 1]);

  function getBarPosition(startDate: string, endDate: string) {
    const start = startDate < monthStart ? monthStart : startDate;
    const end = endDate > monthEnd ? monthEnd : endDate;

    const startIdx = days.findIndex((d) => dateToString(d) === start);
    const endIdx = days.findIndex((d) => dateToString(d) === end);

    if (startIdx === -1 || endIdx === -1) return null;

    const left = (startIdx / days.length) * 100;
    const width = ((endIdx - startIdx + 1) / days.length) * 100;
    return { left, width };
  }

  return (
    <div className="flex-1 overflow-hidden rounded-r-xl border-l border-neutral-200">
      {/* Day header */}
      <div ref={scrollRef} className="overflow-x-auto">
        <div style={{ minWidth: `${Math.max(days.length * 40, 600)}px` }}>
          {/* Date headers */}
          <div className="flex border-b border-neutral-200 bg-neutral-50 sticky top-0 z-10">
            {days.map((day) => (
              <div
                key={day.getDate()}
                className={cn(
                  'flex-1 min-w-[40px] text-center py-1.5 border-r border-neutral-100 last:border-r-0',
                  isToday(day) && 'bg-primary-50',
                  isWeekend(day) && !isToday(day) && 'bg-neutral-100/60',
                )}
              >
                <div className={cn(
                  'text-[10px] font-medium leading-none',
                  isToday(day) && 'text-primary-600',
                  !isToday(day) && isWeekend(day) && 'text-neutral-400',
                  !isToday(day) && !isWeekend(day) && 'text-neutral-500',
                )}>
                  {WEEKDAY_LABELS[day.getDay()]}
                </div>
                <div className={cn(
                  'text-xs font-semibold mt-0.5',
                  isToday(day) ? 'text-primary-700 bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center mx-auto' : 'text-neutral-700',
                )}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row) => {
            const maxBars = Math.max(row.bars.length, 1);
            const rowHeight = ROW_PADDING + maxBars * (BAR_HEIGHT + BAR_GAP);

            return (
              <div
                key={row.id}
                className="relative border-b border-neutral-100"
                style={{ height: `${rowHeight}px` }}
              >
                {/* Grid columns (day backgrounds) */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {days.map((day) => (
                    <div
                      key={day.getDate()}
                      className={cn(
                        'flex-1 min-w-[40px] border-r border-neutral-50 last:border-r-0',
                        isWeekend(day) && 'bg-neutral-50/50',
                      )}
                    />
                  ))}
                </div>

                {/* Today line */}
                {todayIndex >= 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary-400 z-10 pointer-events-none"
                    style={{ left: `${((todayIndex + 0.5) / days.length) * 100}%` }}
                  />
                )}

                {/* Bars */}
                {row.bars.map((bar, subIndex) => {
                  const pos = getBarPosition(bar.startDate, bar.endDate);
                  if (!pos) return null;
                  return (
                    <GanttBarComponent
                      key={bar.executionId}
                      bar={bar}
                      left={pos.left}
                      width={pos.width}
                      subIndex={subIndex}
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Empty state */}
          {rows.length === 0 && (
            <div className="flex items-center justify-center py-32 text-sm text-neutral-400">
              Sem trabalhos agendados neste mês
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
