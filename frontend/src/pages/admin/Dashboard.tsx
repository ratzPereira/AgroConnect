import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, DollarSign, Star } from 'lucide-react';
import { getAdminDashboard, listDisputes } from '@/api/admin';
import { AnimatedPage } from '@/components/AnimatedPage';
import { DashboardStatCards } from '@/features/dashboard/components/DashboardStatCards';
import { DataTable } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AdminDispute } from '@/types/admin';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
  });

  const { data: disputes, isLoading: disputesLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => listDisputes(),
  });

  if (isLoading) {
    return (
      <AnimatedPage>
        <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900 mb-6">
          Administração
        </h1>
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {['ss-0', 'ss-1', 'ss-2', 'ss-3'].map(k => (
              <Skeleton.Stat key={k} />
            ))}
          </div>
          <Skeleton.Table />
        </div>
      </AnimatedPage>
    );
  }

  const stats = [
    {
      label: 'Utilizadores',
      value: dashboard?.totalUsers ?? 0,
      icon: <Users className="h-4 w-4 text-secondary-600" />,
      iconBg: 'bg-secondary-50',
    },
    {
      label: 'Pedidos',
      value: dashboard?.totalRequests ?? 0,
      icon: <FileText className="h-4 w-4 text-primary-600" />,
      iconBg: 'bg-primary-50',
    },
    {
      label: 'Volume total',
      value: dashboard?.totalVolume ?? 0,
      prefix: '€',
      decimals: 2,
      icon: <DollarSign className="h-4 w-4 text-leaf-600" />,
      iconBg: 'bg-leaf-50',
    },
    {
      label: 'Rating médio',
      value: dashboard?.avgPlatformRating ?? 0,
      decimals: 1,
      icon: <Star className="h-4 w-4 text-warning-600" />,
      iconBg: 'bg-warning-50',
    },
  ];

  const disputeColumns = [
    { key: 'requestTitle', header: 'Pedido', render: (d: AdminDispute) => <span className="font-medium text-neutral-900">{d.requestTitle}</span>, sortable: true },
    { key: 'clientName', header: 'Cliente', render: (d: AdminDispute) => d.clientName },
    { key: 'providerName', header: 'Prestador', render: (d: AdminDispute) => d.providerName },
    { key: 'amount', header: 'Valor', render: (d: AdminDispute) => `€${d.amount.toFixed(2)}`, sortable: true },
    { key: 'createdAt', header: 'Data', render: (d: AdminDispute) => new Date(d.createdAt).toLocaleDateString('pt-PT'), sortable: true },
  ];

  return (
    <AnimatedPage>
      <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900 mb-6">
        Administração
      </h1>
      <div className="space-y-6">
        <DashboardStatCards stats={stats} />
        <div>
          <h2 className="text-sm font-semibold text-neutral-800 mb-3">Disputas pendentes</h2>
          <DataTable
            columns={disputeColumns}
            data={disputes?.content ?? []}
            keyExtractor={(d) => d.requestId}
            loading={disputesLoading}
            emptyTitle="Sem disputas pendentes"
            emptyDescription="Não existem disputas por resolver."
            onRowClick={(d) => navigate(`/requests/${d.requestId}`)}
          />
        </div>
      </div>
    </AnimatedPage>
  );
}
