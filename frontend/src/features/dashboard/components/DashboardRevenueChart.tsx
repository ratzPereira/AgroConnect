import { useMemo } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import type { MonthlyBreakdown } from '@/api/finance';
import { cn } from '@/utils/cn';

const MONTH_LABELS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface DashboardRevenueChartProps {
  readonly breakdown: MonthlyBreakdown | undefined;
  readonly isLoading?: boolean;
  readonly className?: string;
}

function formatEuro(value: number): string {
  return `${value.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`;
}

interface TooltipPayloadItem {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-neutral-800 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-neutral-600">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-neutral-500">{entry.name}:</span>
          <span className="font-semibold text-neutral-800">{formatEuro(entry.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
}

export function DashboardRevenueChart({ breakdown, isLoading, className }: DashboardRevenueChartProps) {
  const chartData = useMemo(() => {
    if (!breakdown) return [];
    return breakdown.months.map((m) => ({
      month: MONTH_LABELS_SHORT[m.month - 1] ?? String(m.month),
      receita: Math.round(m.revenue),
      lucro: Math.round(m.netProfit),
      payouts: Math.round(m.payouts),
    }));
  }, [breakdown]);

  const totals = useMemo(() => {
    if (!breakdown) return { revenue: 0, profit: 0, jobs: 0, bestMonth: null as { month: string; revenue: number } | null };
    let revenue = 0;
    let profit = 0;
    let jobs = 0;
    let bestMonth: { month: string; revenue: number } | null = null;
    for (const m of breakdown.months) {
      revenue += m.revenue;
      profit += m.netProfit;
      jobs += m.completedJobs;
      if (!bestMonth || m.revenue > bestMonth.revenue) {
        bestMonth = { month: MONTH_LABELS_SHORT[m.month - 1] ?? String(m.month), revenue: m.revenue };
      }
    }
    return { revenue, profit, jobs, bestMonth };
  }, [breakdown]);

  const currentMonthIdx = new Date().getMonth();
  const isCurrentYear = breakdown?.year === new Date().getFullYear();

  const { thisMonthRevenue, momDelta } = useMemo(() => {
    if (!breakdown) return { thisMonthRevenue: 0, momDelta: null as number | null };
    const months = breakdown.months;
    const thisIdx = isCurrentYear ? currentMonthIdx : months.length - 1;
    const lastIdx = thisIdx - 1;
    const thisM = months[thisIdx]?.revenue ?? 0;
    const lastM = lastIdx >= 0 ? (months[lastIdx]?.revenue ?? 0) : 0;
    let delta: number | null = null;
    if (lastM > 0) {
      delta = ((thisM - lastM) / lastM) * 100;
    } else if (thisM > 0) {
      delta = 100;
    }
    return { thisMonthRevenue: thisM, momDelta: delta };
  }, [breakdown, currentMonthIdx, isCurrentYear]);

  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary-50">
              <TrendingUp className="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Receita e lucro · {breakdown?.year ?? '—'}</h3>
              <p className="text-[11px] text-neutral-500">Evolução mensal dos últimos 12 meses</p>
            </div>
          </div>
        </div>
        {momDelta !== null && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] text-neutral-500">Este mês</p>
              <p className="text-base font-bold text-neutral-900 leading-tight">{formatEuro(thisMonthRevenue)}</p>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold',
                momDelta >= 0 ? 'bg-leaf-50 text-leaf-700' : 'bg-danger-50 text-danger-700',
              )}
            >
              {momDelta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(momDelta).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <SummaryTile label="Receita YTD" value={formatEuro(totals.revenue)} tone="primary" />
        <SummaryTile label="Lucro YTD" value={formatEuro(totals.profit)} tone={totals.profit >= 0 ? 'leaf' : 'danger'} />
        <SummaryTile label="Trabalhos concluídos" value={totals.jobs.toString()} tone="neutral" />
        <SummaryTile
          label="Melhor mês"
          value={totals.bestMonth ? `${totals.bestMonth.month} · ${formatEuro(totals.bestMonth.revenue)}` : '—'}
          tone="neutral"
          small
        />
      </div>

      {isLoading && (
        <div className="h-[280px] rounded-lg bg-neutral-50 animate-pulse" />
      )}

      {!isLoading && chartData.every((d) => d.receita === 0 && d.lucro === 0) && (
        <div className="flex h-[280px] flex-col items-center justify-center gap-1 text-sm text-neutral-500">
          <TrendingUp className="h-8 w-8 text-neutral-300" />
          <p className="font-medium">Sem receitas registadas neste ano</p>
          <p className="text-xs text-neutral-400">Quando concluir trabalhos, o gráfico mostrará a evolução mensal.</p>
        </div>
      )}

      {!isLoading && chartData.some((d) => d.receita !== 0 || d.lucro !== 0) && (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2D8A2D" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2D8A2D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F1EFEA" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8F8C82' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#8F8C82' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 6 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="receita" name="Receita" fill="#2D8A2D" radius={[4, 4, 0, 0]} barSize={18} />
              <Area
                type="monotone"
                dataKey="lucro"
                name="Lucro"
                stroke="#0D6E6E"
                strokeWidth={2}
                fill="url(#revenueAreaGradient)"
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="payouts"
                name="Pagamentos"
                stroke="#C57F00"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

interface SummaryTileProps {
  readonly label: string;
  readonly value: string;
  readonly tone: 'primary' | 'leaf' | 'danger' | 'neutral';
  readonly small?: boolean;
}

const TONE_CLASSES: Record<SummaryTileProps['tone'], string> = {
  primary: 'bg-primary-50/60 border-primary-100 text-primary-800',
  leaf: 'bg-leaf-50/60 border-leaf-100 text-leaf-800',
  danger: 'bg-danger-50/60 border-danger-100 text-danger-800',
  neutral: 'bg-neutral-50 border-neutral-150 text-neutral-800',
};

function SummaryTile({ label, value, tone, small }: SummaryTileProps) {
  return (
    <div className={cn('rounded-lg border px-3 py-2.5', TONE_CLASSES[tone])}>
      <p className="text-[10px] uppercase tracking-wide font-medium opacity-70">{label}</p>
      <p className={cn('font-bold leading-tight mt-0.5', small ? 'text-sm' : 'text-lg')}>{value}</p>
    </div>
  );
}
