import { buildHourTicks, formatHourLabel } from '../../utils/timeMath';
import { HOUR_HEIGHT_PX } from '../../utils/weekLayout';

export function WeekTimeGutter() {
  const hours = buildHourTicks();

  return (
    <div className="w-16 flex-shrink-0 border-r border-neutral-200 bg-neutral-50">
      {hours.map((h, idx) => (
        <div
          key={h}
          style={{ height: idx === hours.length - 1 ? 0 : HOUR_HEIGHT_PX }}
          className="relative"
        >
          <span className="absolute -top-2 right-2 text-[10px] font-medium text-neutral-500">
            {formatHourLabel(h)}
          </span>
        </div>
      ))}
    </div>
  );
}
