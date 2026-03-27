import { cn } from '@/utils/cn';
import type { GanttRow } from '@/types/calendar';

interface GanttSidebarProps {
  rows: GanttRow[];
}

const BAR_HEIGHT = 34;
const BAR_GAP = 4;
const ROW_PADDING = 12;

export function GanttSidebar({ rows }: GanttSidebarProps) {
  return (
    <div className="w-[200px] shrink-0 border-r border-neutral-200 bg-white rounded-l-xl">
      {/* Header spacer */}
      <div className="h-[46px] border-b border-neutral-200 flex items-center px-3">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Recurso</span>
      </div>

      {/* Row labels */}
      {rows.map((row) => {
        const maxBars = Math.max(row.bars.length, 1);
        const rowHeight = ROW_PADDING + maxBars * (BAR_HEIGHT + BAR_GAP);

        return (
          <div
            key={row.id}
            className={cn(
              'flex flex-col justify-center px-3 border-b border-neutral-100',
            )}
            style={{ height: `${rowHeight}px` }}
          >
            <p className="text-sm font-medium text-neutral-800 truncate leading-tight">
              {row.label}
            </p>
            {row.sublabel && (
              <p className="text-[11px] text-neutral-400 truncate leading-tight mt-0.5">
                {row.sublabel}
              </p>
            )}
          </div>
        );
      })}

      {rows.length === 0 && (
        <div className="h-[100px]" />
      )}
    </div>
  );
}
