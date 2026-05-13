import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import type { WorkloadHeatmap as WorkloadHeatmapData } from '@/types/calendar';
import { parseIsoDate } from '../../utils/viewRange';

interface WorkloadHeatmapProps {
  data: WorkloadHeatmapData | undefined;
  isLoading: boolean;
  onCellClick?: (dateIso: string) => void;
}

const WORK_DAY_MINUTES = 840;

function loadColorClass(ratio: number): string {
  if (ratio <= 0) return 'bg-neutral-100 text-neutral-400';
  if (ratio < 0.25) return 'bg-leaf-100 text-leaf-700';
  if (ratio < 0.5) return 'bg-leaf-200 text-leaf-800';
  if (ratio < 0.75) return 'bg-leaf-300 text-leaf-900';
  if (ratio < 0.9) return 'bg-warning-100 text-warning-800';
  if (ratio < 1) return 'bg-warning-400 text-warning-900';
  if (ratio < 1.15) return 'bg-danger-300 text-danger-900';
  return 'bg-danger-500 text-white';
}

function formatHours(minutes: number): string {
  return `${(minutes / 60).toFixed(1)}h`;
}

function shortDay(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}

export function WorkloadHeatmap({ data, isLoading, onCellClick }: WorkloadHeatmapProps) {
  const dates = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const op of data.operators) {
      for (const date of Object.keys(op.minutesByDate)) set.add(date);
    }
    return Array.from(set).sort();
  }, [data]);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-3 h-4 w-40 animate-pulse rounded bg-neutral-100" />
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="h-7 animate-pulse rounded bg-neutral-100" />
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.operators.length === 0) {
    return (
      <section className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">
        Sem dados de carga para o intervalo selecionado.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Carga por operador</h3>
          <p className="text-[11px] text-neutral-500">
            Tons mais escuros = mais minutos alocados. Acima de 100% = sobrecarga.
          </p>
        </div>
        <Legend />
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-separate" style={{ borderSpacing: '2px' }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                Operador
              </th>
              {dates.map((d) => (
                <th
                  key={d}
                  className="px-1 text-center text-[10px] font-medium text-neutral-500"
                  style={{ minWidth: 36 }}
                >
                  {shortDay(d)}
                </th>
              ))}
              <th className="px-2 text-right text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.operators.map((op) => (
              <tr key={op.teamMemberId}>
                <td className="sticky left-0 z-10 bg-white px-2 py-1 text-xs">
                  <div className="font-medium text-neutral-800 truncate max-w-[140px]" title={op.teamMemberName}>
                    {op.teamMemberName}
                  </div>
                  <div className="text-[10px] text-neutral-500">{op.role}</div>
                </td>
                {dates.map((d) => {
                  const minutes = op.minutesByDate[d] ?? 0;
                  const ratio = minutes / WORK_DAY_MINUTES;
                  const colorClass = loadColorClass(ratio);
                  return (
                    <td key={d} className="p-0">
                      <button
                        type="button"
                        onClick={() => onCellClick?.(d)}
                        className={cn(
                          'flex h-7 w-full items-center justify-center rounded text-[10px] font-medium transition-transform hover:scale-110',
                          colorClass,
                        )}
                        title={`${op.teamMemberName} · ${d} · ${formatHours(minutes)} (${Math.round(ratio * 100)}%)`}
                      >
                        {ratio > 0 ? `${Math.round(ratio * 100)}` : ''}
                      </button>
                    </td>
                  );
                })}
                <td className="px-2 py-1 text-right text-xs font-mono text-neutral-700">
                  {formatHours(op.totalMinutes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Legend() {
  const buckets: Array<[string, string]> = [
    ['<25%', 'bg-leaf-100'],
    ['25–50%', 'bg-leaf-200'],
    ['50–75%', 'bg-leaf-300'],
    ['75–90%', 'bg-warning-100'],
    ['90–100%', 'bg-warning-400'],
    ['>100%', 'bg-danger-500'],
  ];
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
      {buckets.map(([label, cls]) => (
        <span key={label} className="flex items-center gap-1">
          <span className={cn('h-3 w-3 rounded', cls)} />
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}
