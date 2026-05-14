import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, History, Minus } from 'lucide-react';
import { listMovements } from '@/api/inventory';
import { Card, CardBody } from '@/components/ui/Card';
import type { InventoryMovement, InventoryUnit } from '@/types/inventory';
import { cn } from '@/utils/cn';

const UNIT_LABELS: Record<InventoryUnit, string> = { KG: 'kg', L: 'L', UNIT: 'un' };

interface PriceHistoryProps {
  readonly itemId: number;
  readonly unit: InventoryUnit;
  readonly currentWac: number | null;
}

interface PricePoint {
  movementId: number;
  dateIso: string;
  dateLabel: string;
  unitCost: number;
  quantity: number;
  reason: string | null;
}

function buildPoints(movements: InventoryMovement[]): PricePoint[] {
  return movements
    .filter((m) => m.unitCost != null && (m.movementType === 'PURCHASE' || m.movementType === 'ADJUSTMENT_IN' || m.movementType === 'INITIAL'))
    .map((m) => ({
      movementId: m.id,
      dateIso: m.createdAt,
      dateLabel: new Date(m.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
      unitCost: m.unitCost as number,
      quantity: Math.abs(m.quantityDelta),
      reason: m.reason,
    }))
    .sort((a, b) => a.dateIso.localeCompare(b.dateIso));
}

function computeStats(points: PricePoint[]): {
  min: number;
  max: number;
  avg: number;
  latest: number;
  totalSpend: number;
  totalQty: number;
  trendPct: number | null;
} | null {
  if (points.length === 0) return null;
  let min = points[0].unitCost;
  let max = points[0].unitCost;
  let totalSpend = 0;
  let totalQty = 0;
  for (const p of points) {
    if (p.unitCost < min) min = p.unitCost;
    if (p.unitCost > max) max = p.unitCost;
    totalSpend += p.unitCost * p.quantity;
    totalQty += p.quantity;
  }
  const avg = totalQty > 0 ? totalSpend / totalQty : 0;
  const latest = points[points.length - 1].unitCost;
  const first = points[0].unitCost;
  let trendPct: number | null = null;
  if (points.length > 1 && first > 0) {
    trendPct = ((latest - first) / first) * 100;
  }
  return { min, max, avg, latest, totalSpend, totalQty, trendPct };
}

interface TooltipPayloadItem {
  payload?: PricePoint;
  value?: number;
}

function PriceTooltip({ active, payload, unit }: { active?: boolean; payload?: TooltipPayloadItem[]; unit: InventoryUnit }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  if (!point) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-neutral-800">
        {new Date(point.dateIso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>
      <p className="text-neutral-700">
        <span className="font-semibold">€{point.unitCost.toFixed(4)}</span>
        <span className="text-neutral-500"> / {UNIT_LABELS[unit]}</span>
      </p>
      <p className="text-neutral-500">
        {point.quantity.toLocaleString('pt-PT', { maximumFractionDigits: 3 })} {UNIT_LABELS[unit]} comprados
      </p>
      {point.reason && <p className="text-neutral-400 italic truncate max-w-[200px]">{point.reason}</p>}
    </div>
  );
}

export function PriceHistory({ itemId, unit, currentWac }: PriceHistoryProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', itemId, 'price-history'],
    queryFn: () => listMovements(itemId, 0, 200),
    enabled: Number.isFinite(itemId),
  });

  const points = useMemo(() => buildPoints(data?.content ?? []), [data]);
  const stats = useMemo(() => computeStats(points), [points]);

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <div className="h-[280px] rounded-lg bg-neutral-50 animate-pulse" />
        </CardBody>
      </Card>
    );
  }

  if (points.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <History className="h-8 w-8 text-neutral-300 mb-2" />
            <p className="text-sm font-medium text-neutral-700">Ainda não há histórico de preços</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-md">
              Quando registar compras ou ajustes com custo, o preço pago será mantido aqui para acompanhar a evolução ao longo do tempo.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const TrendIcon = ((): { icon: typeof ArrowUpRight; tone: string } => {
    if (stats?.trendPct == null || stats.trendPct === 0) return { icon: Minus, tone: 'bg-neutral-100 text-neutral-600' };
    if (stats.trendPct > 0) return { icon: ArrowUpRight, tone: 'bg-warning-50 text-warning-700' };
    return { icon: ArrowDownRight, tone: 'bg-leaf-50 text-leaf-700' };
  })();
  const TrendIconCmp = TrendIcon.icon;

  const minMaxSpread = stats!.max - stats!.min;
  const showMinMax = minMaxSpread > 0.0001;

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary-50">
                <History className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Histórico de preços</h3>
                <p className="text-[11px] text-neutral-500">
                  {points.length} {points.length === 1 ? 'compra registada' : 'compras registadas'} · linha tracejada = custo médio (WAC) atual
                </p>
              </div>
            </div>
            {stats?.trendPct != null && (
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', TrendIcon.tone)}>
                <TrendIconCmp className="h-3.5 w-3.5" />
                {stats.trendPct >= 0 ? '+' : ''}{stats.trendPct.toFixed(1)}% desde a primeira compra
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <StatTile label="Último preço" value={`€${stats!.latest.toFixed(4)}`} sub={`por ${UNIT_LABELS[unit]}`} tone="primary" />
            <StatTile label="Preço médio (WAC)" value={currentWac == null ? '—' : `€${currentWac.toFixed(4)}`} sub={`por ${UNIT_LABELS[unit]}`} tone="leaf" />
            <StatTile label="Mais barato" value={`€${stats!.min.toFixed(4)}`} sub={showMinMax ? 'mínimo histórico' : '—'} tone="neutral" />
            <StatTile label="Mais caro" value={`€${stats!.max.toFixed(4)}`} sub={showMinMax ? 'máximo histórico' : '—'} tone="neutral" />
          </div>

          {points.length >= 2 && (
            <div className="h-[220px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2D8A2D" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#2D8A2D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#F1EFEA" vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#8F8C82' }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: '#8F8C82' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `€${typeof v === 'number' ? v.toFixed(2) : v}`}
                    width={56}
                  />
                  <Tooltip content={<PriceTooltip unit={unit} />} />
                  {currentWac != null && (
                    <ReferenceLine
                      y={currentWac}
                      stroke="#0D6E6E"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      label={{ value: `WAC €${currentWac.toFixed(2)}`, position: 'right', fill: '#0D6E6E', fontSize: 10 }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="unitCost"
                    stroke="#2D8A2D"
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                    dot={{ r: 3, stroke: '#2D8A2D', strokeWidth: 2, fill: 'white' }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {points.length === 1 && (
            <div className="rounded-lg border border-dashed border-neutral-200 px-4 py-6 text-center text-xs text-neutral-500">
              Apenas uma compra registada. Registe mais compras para ver a evolução do preço ao longo do tempo.
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <div className="px-4 py-3 border-b border-neutral-100">
          <h4 className="text-sm font-semibold text-neutral-800">Compras registadas</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-2.5 font-medium">Data</th>
                <th className="px-4 py-2.5 font-medium">Quantidade</th>
                <th className="px-4 py-2.5 font-medium">Preço unitário</th>
                <th className="px-4 py-2.5 font-medium">Total</th>
                <th className="hidden md:table-cell px-4 py-2.5 font-medium">Nota</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p, idx, arr) => {
                const previous = arr[idx + 1];
                const diff = previous ? p.unitCost - previous.unitCost : 0;
                const showDiff = previous && Math.abs(diff) > 0.0001;
                return (
                  <tr key={p.movementId} className="border-b border-neutral-100">
                    <td className="px-4 py-2.5 text-neutral-700">
                      {new Date(p.dateIso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-700">
                      {p.quantity.toLocaleString('pt-PT', { maximumFractionDigits: 3 })} {UNIT_LABELS[unit]}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900">€{p.unitCost.toFixed(4)}</span>
                        {showDiff && (
                          <span className={cn(
                            'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                            diff > 0 ? 'bg-warning-50 text-warning-700' : 'bg-leaf-50 text-leaf-700',
                          )}>
                            {diff > 0 ? '+' : ''}€{diff.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">€{(p.unitCost * p.quantity).toFixed(2)}</td>
                    <td className="hidden md:table-cell px-4 py-2.5 text-neutral-500 italic">{p.reason ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-50/60 text-neutral-700">
                <td className="px-4 py-2.5 font-medium" colSpan={3}>Total acumulado</td>
                <td className="px-4 py-2.5 font-bold">€{stats!.totalSpend.toFixed(2)}</td>
                <td className="hidden md:table-cell px-4 py-2.5 text-xs text-neutral-500">
                  {stats!.totalQty.toLocaleString('pt-PT', { maximumFractionDigits: 3 })} {UNIT_LABELS[unit]} no total
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

interface StatTileProps {
  readonly label: string;
  readonly value: string;
  readonly sub: string;
  readonly tone: 'primary' | 'leaf' | 'neutral';
}

const TILE_TONES: Record<StatTileProps['tone'], string> = {
  primary: 'bg-primary-50/60 border-primary-100',
  leaf: 'bg-leaf-50/60 border-leaf-100',
  neutral: 'bg-neutral-50 border-neutral-150',
};

function StatTile({ label, value, sub, tone }: StatTileProps) {
  return (
    <div className={cn('rounded-lg border px-3 py-2.5', TILE_TONES[tone])}>
      <p className="text-[10px] uppercase tracking-wide font-medium text-neutral-500">{label}</p>
      <p className="text-lg font-bold text-neutral-900 leading-tight mt-0.5">{value}</p>
      <p className="text-[10px] text-neutral-500 mt-0.5">{sub}</p>
    </div>
  );
}
