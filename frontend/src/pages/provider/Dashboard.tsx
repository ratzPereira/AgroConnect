import { useQuery } from '@tanstack/react-query';
import { getFinanceSummary } from '@/api/finance';
import { getLowStockItems } from '@/api/inventory';
import { listMachines } from '@/api/machines';
import { Card, CardBody } from '@/components/ui/Card';
import { Loader2, Briefcase, TrendingUp, AlertTriangle, Wrench } from 'lucide-react';

export function ProviderDashboard() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: getFinanceSummary,
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: getLowStockItems,
  });

  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: () => listMachines(),
  });

  const upcomingMaintenance = machines?.filter(
    (m) => m.nextMaintenanceDate && new Date(m.nextMaintenanceDate) <= new Date(Date.now() + 30 * 86400000),
  ).length ?? 0;

  if (summaryLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-neutral-900 mb-6">Painel do Prestador</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Briefcase} label="Trabalhos concluídos" value={summary?.completedJobs ?? 0} />
        <StatCard icon={TrendingUp} label="Ganhos totais" value={`€${summary?.totalEarnings?.toFixed(2) ?? '0.00'}`} />
        <StatCard icon={AlertTriangle} label="Stock baixo" value={lowStock?.length ?? 0} color="amber" />
        <StatCard icon={Wrench} label="Manutenção próxima" value={upcomingMaintenance} color="orange" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <h2 className="font-semibold text-neutral-900 text-sm mb-3">Resumo financeiro</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Receita total</dt><dd className="font-medium">€{summary?.totalRevenue?.toFixed(2) ?? '0.00'}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Comissões</dt><dd className="font-medium">€{summary?.totalCommissions?.toFixed(2) ?? '0.00'}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Pagamentos pendentes</dt><dd className="font-medium">€{summary?.pendingPayouts?.toFixed(2) ?? '0.00'}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Ganhos este mês</dt><dd className="font-medium text-green-700">€{summary?.thisMonthEarnings?.toFixed(2) ?? '0.00'}</dd></div>
            </dl>
          </CardBody>
        </Card>
        {lowStock && lowStock.length > 0 && (
          <Card>
            <CardBody>
              <h2 className="font-semibold text-neutral-900 text-sm mb-3">Itens com stock baixo</h2>
              <ul className="space-y-2 text-sm">
                {lowStock.map((item) => (
                  <li key={item.id} className="flex justify-between text-amber-700">
                    <span>{item.productName}</span>
                    <span className="font-medium">{item.quantity} {item.unit}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = 'green' }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorMap[color] ?? colorMap.green}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="text-lg font-bold text-neutral-900">{value}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
