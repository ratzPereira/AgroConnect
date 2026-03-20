import { useQuery } from '@tanstack/react-query';
import { getFinanceSummary, getFinanceTransactions } from '@/api/finance';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Loader2, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

const statusLabels: Record<string, string> = { PENDING: 'Pendente', HELD: 'Retido', RELEASED: 'Libertado', REFUNDED: 'Reembolsado' };
const statusColors: Record<string, string> = {
  PENDING: 'bg-neutral-100 text-neutral-600',
  HELD: 'bg-yellow-100 text-yellow-700',
  RELEASED: 'bg-green-100 text-green-700',
  REFUNDED: 'bg-red-100 text-red-700',
};

export function Finance() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: getFinanceSummary,
  });

  const { data: transactions } = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: () => getFinanceTransactions(),
  });

  if (summaryLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-neutral-900 mb-6">Finanças</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard icon={DollarSign} label="Ganhos totais" value={`€${summary?.totalEarnings?.toFixed(2) ?? '0.00'}`} />
        <SummaryCard icon={TrendingUp} label="Este mês" value={`€${summary?.thisMonthEarnings?.toFixed(2) ?? '0.00'}`} />
        <SummaryCard icon={Clock} label="Pendentes" value={`€${summary?.pendingPayouts?.toFixed(2) ?? '0.00'}`} />
        <SummaryCard icon={CheckCircle} label="Trabalhos" value={summary?.completedJobs ?? 0} />
      </div>
      <Card>
        <CardHeader><h2 className="font-semibold text-neutral-900 text-sm">Histórico de transações</h2></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-6 py-3 font-medium">ID</th>
              <th className="px-6 py-3 font-medium">Valor</th>
              <th className="px-6 py-3 font-medium">Comissão</th>
              <th className="px-6 py-3 font-medium">Pagamento</th>
              <th className="px-6 py-3 font-medium">Estado</th>
              <th className="px-6 py-3 font-medium">Data</th>
            </tr></thead>
            <tbody>
              {transactions?.content?.map((tx) => (
                <tr key={tx.id} className="border-b border-neutral-100">
                  <td className="px-6 py-3 text-neutral-600">#{tx.id}</td>
                  <td className="px-6 py-3 font-medium">€{tx.amount.toFixed(2)}</td>
                  <td className="px-6 py-3 text-neutral-500">€{tx.commissionAmount.toFixed(2)}</td>
                  <td className="px-6 py-3 text-green-700 font-medium">€{tx.providerPayout.toFixed(2)}</td>
                  <td className="px-6 py-3"><span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColors[tx.status] ?? '')}>{statusLabels[tx.status] ?? tx.status}</span></td>
                  <td className="px-6 py-3 text-neutral-500">{new Date(tx.createdAt).toLocaleDateString('pt-PT')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!transactions?.content || transactions.content.length === 0) && <div className="px-6 py-6 text-center text-sm text-neutral-500">Sem transações.</div>}
      </Card>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card><CardBody>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-50 text-green-700"><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="text-lg font-bold text-neutral-900">{value}</p>
        </div>
      </div>
    </CardBody></Card>
  );
}
