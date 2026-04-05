import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getFinanceSummary, getFinanceTransactions, exportFinanceCsv } from '@/api/finance';
import { toast } from 'sonner';
import { Card, CardHeader } from '@/components/ui/Card';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmptyTransactions } from '@/components/illustrations/EmptyTransactions';
import { TransactionDetailModal } from '@/features/transactions/components/TransactionDetailModal';
import { TrendingUp, DollarSign, Clock, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import type { TransactionStatus } from '@/types/transaction';
import type { TransactionItem } from '@/api/finance';

const statusLabels: Record<string, string> = { PENDING: 'Pendente', HELD: 'Retido', RELEASED: 'Libertado', REFUNDED: 'Reembolsado' };
const statusColors: Record<string, string> = {
  PENDING: 'bg-neutral-100 text-neutral-600',
  HELD: 'bg-warning-100 text-warning-700',
  RELEASED: 'bg-leaf-100 text-leaf-700',
  REFUNDED: 'bg-danger-100 text-danger-700',
};

export function Finance() {
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
    queryKey: ['finance-summary'],
    queryFn: getFinanceSummary,
  });

  const { data: transactions } = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: () => getFinanceTransactions(),
  });

  return (
    <AnimatedPage>
      <h1 className="text-xl font-bold text-neutral-900 mb-6">Finanças</h1>

      {summaryLoading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Skeleton.Stat />
            <Skeleton.Stat />
            <Skeleton.Stat />
            <Skeleton.Stat />
          </div>
          <Skeleton.Table />
        </>
      ) : (
        <>
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
