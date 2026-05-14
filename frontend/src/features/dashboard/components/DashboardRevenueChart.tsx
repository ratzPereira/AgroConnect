import { useMemo } from 'react';
import {
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
import { AlertTriangle, TrendingUp } from 'lucide-react';
import type { MonthlyBreakdown } from '@/api/finance';
import { cn } from '@/utils/cn';

const MONTH_LABELS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const COLORS = {
  comissao: '#94A3B8',
  materiais: '#EAB308',
  maoObra: '#F97316',
  maquinas: '#DC2626',
  receita: '#0F766E',
} as const;

interface DashboardRevenueChartProps {
  readonly breakdown: MonthlyBreakdown | undefined;
  readonly isLoading?: boolean;
  readonly className?: string;
}

interface ChartDatum {
  month: string;
  receita: number;
  comissao: number;
  materiais: number;
  maoObra: number;
  maquinas: number;
  lucro: number;
  totalCustos: number;
}

function formatEuro(value: number): string {
  return `${value.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`;
}

function pct(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

interface TooltipPayloadItem {
  payload?: ChartDatum;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;
  const margem = datum.receita > 0 ? (datum.lucro / datum.receita) * 100 : 0;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 shadow-md text-xs min-w-[210px]">
      <p className="font-semibold text-neutral-800 mb-2 pb-1.5 border-b border-neutral-100">{label}</p>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="flex items-center gap-1.5 text-neutral-700">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS.receita }} />
          Receita
        </span>
        <span className="font-bold text-neutral-900 tabular-nums">{formatEuro(datum.receita)}</span>
      </div>
      <div className="pl-3.5 space-y-1 text-neutral-500">
        <TooltipRow color={COLORS.comissao} label="Comissão" value={datum.comissao} />
        <TooltipRow color={COLORS.materiais} label="Materiais" value={datum.materiais} />
        <TooltipRow color={COLORS.maoObra} label="Mão-de-obra" value={datum.maoObra} />
        <TooltipRow color={COLORS.maquinas} label="Máquinas" value={datum.maquinas} />
      </div>
      <div className="flex items-center justify-between gap-3 pt-1.5 mt-1.5 border-t border-neutral-100">
        <span className="text-neutral-700 font-medium">Lucro</span>
        <span className={cn('font-bold tabular-nums', datum.lucro >= 0 ? 'text-leaf-700' : 'text-danger-700')}>
          {formatEuro(datum.lucro)}{' '}
          <span className="text-[10px] font-normal">({margem.toFixed(0)}%)</span>
        </span>
      </div>
    </div>
  );
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="font-medium text-neutral-700 tabular-nums">{formatEuro(value)}</span>
    </div>
  );
}

export function DashboardRevenueChart({ breakdown, isLoading, className }: DashboardRevenueChartProps) {
  const chartData = useMemo<ChartDatum[]>(() => {
    if (!breakdown) return [];
    return breakdown.months.map((m) => {
      const comissao = Math.max(0, m.revenue - m.payouts);
      const totalCustos = comissao + m.materialsCost + m.laborCost + m.machineExpenses;
      return {
        month: MONTH_LABELS_SHORT[m.month - 1] ?? String(m.month),
        receita: Math.round(m.revenue),
        comissao: Math.round(comissao),
        materiais: Math.round(m.materialsCost),
        maoObra: Math.round(m.laborCost),
        maquinas: Math.round(m.machineExpenses),
        lucro: Math.round(m.netProfit),
        totalCustos: Math.round(totalCustos),
      };
    });
  }, [breakdown]);

  const ytd = useMemo(() => {
    if (!breakdown) {
      return { revenue: 0, payouts: 0, commission: 0, materials: 0, labor: 0, machines: 0, profit: 0, jobs: 0, bestMonth: null as { month: string; revenue: number } | null };
    }
    let revenue = 0, payouts = 0, materials = 0, labor = 0, machines = 0, profit = 0, jobs = 0;
    let bestMonth: { month: string; revenue: number } | null = null;
    for (const m of breakdown.months) {
      revenue += m.revenue;
      payouts += m.payouts;
      materials += m.materialsCost;
      labor += m.laborCost;
      machines += m.machineExpenses;
      profit += m.netProfit;
      jobs += m.completedJobs;
      if (!bestMonth || m.revenue > bestMonth.revenue) {
        bestMonth = { month: MONTH_LABELS_SHORT[m.month - 1] ?? String(m.month), revenue: m.revenue };
      }
    }
    return { revenue, payouts, commission: Math.max(0, revenue - payouts), materials, labor, machines, profit, jobs, bestMonth };
  }, [breakdown]);

  const margem = ytd.revenue > 0 ? (ytd.profit / ytd.revenue) * 100 : 0;
  const profitable = ytd.profit >= 0;

  const showEmpty = !isLoading && chartData.every((d) => d.receita === 0 && d.totalCustos === 0);
  const showChart = !isLoading && !showEmpty;

  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary-50">
            <TrendingUp className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Receita e lucro · {breakdown?.year ?? '—'}
            </h3>
            <p className="text-[11px] text-neutral-500">Para onde foi cada euro que entrou</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-4 mb-5">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Anatomia da receita YTD</p>
          <p className="text-base font-bold text-neutral-900 tabular-nums">{formatEuro(ytd.revenue)}</p>
        </div>
        <div className="space-y-2.5">
          <AnatomyRow color={COLORS.comissao} label="Comissão plataforma" value={ytd.commission} total={ytd.revenue} />
          <AnatomyRow color={COLORS.materiais} label="Materiais" value={ytd.materials} total={ytd.revenue} />
          <AnatomyRow color={COLORS.maoObra} label="Mão-de-obra" value={ytd.labor} total={ytd.revenue} />
          <AnatomyRow color={COLORS.maquinas} label="Manutenção e despesas de máquinas" value={ytd.machines} total={ytd.revenue} />
        </div>
        <div
          className={cn(
            'flex items-center justify-between mt-3 pt-3 border-t',
            profitable ? 'border-leaf-200' : 'border-danger-200',
          )}
        >
          <div className="flex items-center gap-2">
            {!profitable && <AlertTriangle className="h-4 w-4 text-danger-600" />}
            <p className="text-sm font-semibold text-neutral-900">Lucro líquido</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-[11px] font-semibold uppercase tracking-wide', profitable ? 'text-leaf-700' : 'text-danger-700')}>
              margem {margem.toFixed(1)}%
            </span>
            <span className={cn('text-lg font-bold tabular-nums', profitable ? 'text-leaf-700' : 'text-danger-700')}>
              {formatEuro(ytd.profit)}
            </span>
          </div>
        </div>
        {ytd.jobs > 0 && (
          <p className="mt-2 text-[11px] text-neutral-500">
            {ytd.jobs} {ytd.jobs === 1 ? 'trabalho concluído' : 'trabalhos concluídos'}
            {ytd.bestMonth && ytd.bestMonth.revenue > 0 && (
              <> · melhor mês: <span className="font-medium text-neutral-700">{ytd.bestMonth.month}</span> ({formatEuro(ytd.bestMonth.revenue)})</>
            )}
          </p>
        )}
      </div>

      {isLoading && <div className="h-[280px] rounded-lg bg-neutral-50 animate-pulse" />}

      {showEmpty && (
        <div className="flex h-[280px] flex-col items-center justify-center gap-1 text-sm text-neutral-500">
          <TrendingUp className="h-8 w-8 text-neutral-300" />
          <p className="font-medium">Sem receitas registadas neste ano</p>
          <p className="text-xs text-neutral-400">Quando concluir trabalhos, o gráfico mostrará a evolução mensal.</p>
        </div>
      )}

      {showChart && (
        <div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#F1EFEA" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8F8C82' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8F8C82' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F9FAFB' }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar dataKey="comissao" name="Comissão" stackId="costs" fill={COLORS.comissao} barSize={22} />
                <Bar dataKey="materiais" name="Materiais" stackId="costs" fill={COLORS.materiais} />
                <Bar dataKey="maoObra" name="Mão-de-obra" stackId="costs" fill={COLORS.maoObra} />
                <Bar dataKey="maquinas" name="Máquinas" stackId="costs" fill={COLORS.maquinas} radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="receita"
                  name="Receita"
                  stroke={COLORS.receita}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: COLORS.receita }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1.5 text-center px-2">
            <span className="inline-block h-1 w-3 rounded-full align-middle mr-1.5" style={{ background: COLORS.receita }} />
            Linha = receita bruta. Barras = onde o dinheiro foi gasto. Quando a barra ultrapassa a linha, o mês deu prejuízo.
          </p>
        </div>
      )}
    </div>
  );
}

interface AnatomyRowProps {
  readonly color: string;
  readonly label: string;
  readonly value: number;
  readonly total: number;
}

function AnatomyRow({ color, label, value, total }: AnatomyRowProps) {
  const percentage = pct(value, total);
  const width = Math.min(100, percentage);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-2 text-neutral-700">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <span className="flex items-baseline gap-2">
          <span className="text-neutral-500 tabular-nums">{percentage.toFixed(0)}%</span>
          <span className="font-semibold text-neutral-800 tabular-nums min-w-[60px] text-right">{formatEuro(value)}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}
