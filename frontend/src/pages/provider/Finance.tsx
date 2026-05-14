import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  getFinanceSummary,
  getFinanceTransactions,
  getMonthlyBreakdown,
  getYearlyComparison,
  exportFinanceCsv,
} from '@/api/finance';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmptyTransactions } from '@/components/illustrations/EmptyTransactions';
import { TransactionDetailModal } from '@/features/transactions/components/TransactionDetailModal';
import {
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Download,
  Wallet,
  Percent,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import type { TransactionStatus } from '@/types/transaction';
import type { TransactionItem } from '@/api/finance';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  HELD: 'Retido',
  RELEASED: 'Libertado',
  REFUNDED: 'Reembolsado',
};
const statusColors: Record<string, string> = {
  PENDING: 'bg-neutral-100 text-neutral-600',
  HELD: 'bg-warning-100 text-warning-700',
  RELEASED: 'bg-leaf-100 text-leaf-700',
  REFUNDED: 'bg-danger-100 text-danger-700',
};
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function currentYear(): number {
  return new Date().getFullYear();
}

export function Finance() {
  const [selectedYear, setSelectedYear] = useState<number>(currentYear());
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [exportFrom, setExportFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [exportTo, setExportTo] = useState(() => new Date().toISOString().slice(0, 10));

  const exportMutation = useMutation({
    mutationFn: () => exportFinanceCsv(exportFrom, exportTo),
    onSuccess: () => toast.success('CSV exportado com sucesso.'),
    onError: () => toast.error('Erro ao exportar CSV.'),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['finance-summary', selectedYear],
    queryFn: () => getFinanceSummary(selectedYear),
  });

  const { data: breakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ['finance-monthly-breakdown', selectedYear],
    queryFn: () => getMonthlyBreakdown(selectedYear),
  });

  const { data: comparison } = useQuery({
    queryKey: ['finance-yearly-comparison'],
    queryFn: () => getYearlyComparison(),
  });

  const { data: transactions } = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: () => getFinanceTransactions(),
  });

  const yearOptions = useMemo(() => {
    const cy = currentYear();
    return [cy, cy - 1, cy - 2, cy - 3, cy - 4];
  }, []);

  const chartData = useMemo(() => {
    if (!breakdown) return [];
    return breakdown.months.map((m) => ({
      label: MONTH_LABELS[m.month - 1],
      revenue: m.revenue,
      netProfit: m.netProfit,
    }));
  }, [breakdown]);

  const isViewingCurrentYear = selectedYear === currentYear();
  const revenueDelta = isViewingCurrentYear && comparison ? comparison.revenueDeltaPct : null;
  const profitDelta = isViewingCurrentYear && comparison ? comparison.profitDeltaPct : null;

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Finanças</h1>
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-500" htmlFor="finance-year">Ano</label>
          <select
            id="finance-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm bg-white"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Skeleton.Stat />
          <Skeleton.Stat />
          <Skeleton.Stat />
          <Skeleton.Stat />
        </div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-neutral-700 mb-3">Ano {summary?.year ?? selectedYear}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Receita do ano"
              value={summary?.yearRevenue ?? 0}
              prefix="€"
              decimals={2}
              trend={revenueDelta ?? undefined}
              icon={<DollarSign className="h-5 w-5 text-primary-600" />}
              iconBg="bg-primary-50"
            />
            <StatCard
              label="Lucro líquido do ano"
              value={summary?.yearNetProfit ?? 0}
              prefix="€"
              decimals={2}
              trend={profitDelta ?? undefined}
              icon={<Wallet className="h-5 w-5 text-leaf-600" />}
              iconBg="bg-leaf-50"
            />
            <StatCard
              label="Margem"
              value={summary?.yearMargin ?? 0}
              suffix="%"
              decimals={2}
              icon={<Percent className="h-5 w-5 text-secondary-600" />}
              iconBg="bg-secondary-50"
            />
            <StatCard
              label="Trabalhos no ano"
              value={summary?.yearCompletedJobs ?? 0}
              icon={<Briefcase className="h-5 w-5 text-warning-600" />}
              iconBg="bg-warning-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Materiais"
              value={summary?.yearMaterialsCost ?? 0}
              prefix="€"
              decimals={2}
            />
            <StatCard
              label="Mão de obra"
              value={summary?.yearLaborCost ?? 0}
              prefix="€"
              decimals={2}
            />
            <StatCard
              label="Despesas de máquinas"
              value={summary?.yearMachineExpenses ?? 0}
              prefix="€"
              decimals={2}
            />
            <StatCard
              label="Lucro médio / trabalho"
              value={summary?.yearAvgJobProfit ?? 0}
              prefix="€"
              decimals={2}
            />
          </div>

          <Card className="mb-8">
            <CardHeader>
              <h2 className="font-semibold text-neutral-900 text-sm">Receita vs lucro líquido — {summary?.year ?? selectedYear}</h2>
            </CardHeader>
            <CardBody>
              {breakdownLoading && (
                <div className="h-[280px] flex items-center justify-center">
                  <div className="text-sm text-neutral-400">A carregar gráfico…</div>
                </div>
              )}
              {!breakdownLoading && chartData.length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-8">Sem dados para este ano.</p>
              )}
              {!breakdownLoading && chartData.length > 0 && (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8F8C82' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#8F8C82' }} />
                      <Tooltip
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #E8E6E0',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value, name) => [
                          `€${Number(value).toFixed(2)}`,
                          name === 'revenue' ? 'Receita' : 'Lucro líquido',
                        ]}
                      />
                      <Legend
                        formatter={(value) => (value === 'revenue' ? 'Receita' : 'Lucro líquido')}
                      />
                      <Bar dataKey="revenue" fill="#2D8A2D" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="netProfit" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>

          <h2 className="text-sm font-semibold text-neutral-700 mb-3">Totais acumulados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Ganhos totais"
              value={summary?.totalEarnings ?? 0}
              prefix="€"
              decimals={2}
              icon={<DollarSign className="h-5 w-5 text-primary-600" />}
              iconBg="bg-primary-50"
            />
            <StatCard
              label="Este mês"
              value={summary?.thisMonthEarnings ?? 0}
              prefix="€"
              decimals={2}
              icon={<TrendingUp className="h-5 w-5 text-leaf-600" />}
              iconBg="bg-leaf-50"
            />
            <StatCard
              label="Pendentes"
              value={summary?.pendingPayouts ?? 0}
              prefix="€"
              decimals={2}
              icon={<Clock className="h-5 w-5 text-warning-600" />}
              iconBg="bg-warning-50"
            />
            <StatCard
              label="Trabalhos concluídos"
              value={summary?.completedJobs ?? 0}
              icon={<CheckCircle className="h-5 w-5 text-secondary-600" />}
              iconBg="bg-secondary-50"
            />
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="font-semibold text-neutral-900 text-sm">Histórico de transações</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={exportFrom}
                    onChange={(e) => setExportFrom(e.target.value)}
                    className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                  />
                  <span className="text-xs text-neutral-400">a</span>
                  <input
                    type="date"
                    value={exportTo}
                    onChange={(e) => setExportTo(e.target.value)}
                    className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    loading={exportMutation.isPending}
                    onClick={() => exportMutation.mutate()}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="hidden sm:table-cell px-6 py-3 font-medium">ID</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">Valor</th>
                  <th className="hidden md:table-cell px-6 py-3 font-medium">Comissão</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">Pagamento</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">Estado</th>
                  <th className="hidden sm:table-cell px-6 py-3 font-medium">Data</th>
                </tr></thead>
                <tbody>
                  {transactions?.content?.map((tx) => (
                    <tr key={tx.id} className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setSelectedTx(tx)}>
                      <td className="hidden sm:table-cell px-6 py-3 text-neutral-600">#{tx.id}</td>
                      <td className="px-3 sm:px-6 py-3 font-medium">€{tx.amount.toFixed(2)}</td>
                      <td className="hidden md:table-cell px-6 py-3 text-neutral-500">€{tx.commissionAmount.toFixed(2)}</td>
                      <td className="px-3 sm:px-6 py-3 text-leaf-700 font-medium">€{tx.providerPayout.toFixed(2)}</td>
                      <td className="px-3 sm:px-6 py-3"><span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColors[tx.status] ?? '')}>{statusLabels[tx.status] ?? tx.status}</span></td>
                      <td className="hidden sm:table-cell px-6 py-3 text-neutral-500">{new Date(tx.createdAt).toLocaleDateString('pt-PT')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!transactions?.content || transactions.content.length === 0) && (
              <EmptyState
                illustration={<EmptyTransactions className="w-48 h-auto" />}
                title="Sem transações"
                description="O histórico de transações aparecerá aqui quando tiver serviços concluídos."
              />
            )}
          </Card>
        </>
      )}

      <TransactionDetailModal
        transaction={selectedTx ? { ...selectedTx, status: selectedTx.status as TransactionStatus } : null}
        open={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
      />
    </AnimatedPage>
  );
}
