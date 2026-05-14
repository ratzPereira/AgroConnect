import { useQuery } from '@tanstack/react-query';
import { FileText, MessageSquare, CheckCircle2, DollarSign } from 'lucide-react';
import { getClientDashboardStats } from '@/api/dashboard';
import { DashboardStatCards } from './DashboardStatCards';
import { ActivityTimeline } from './ActivityTimeline';
import { ActiveRequestCards } from './ActiveRequestCards';
import { NextActionsPanel } from './NextActionsPanel';
import { Skeleton } from '@/components/ui/Skeleton';

export function ClientDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['client-dashboard'],
    queryFn: getClientDashboardStats,
    refetchOnMount: 'always',
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {['ss-0', 'ss-1', 'ss-2', 'ss-3'].map(k => (
            <Skeleton.Stat key={k} />
          ))}
        </div>
        <Skeleton.Rect className="h-24" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton.Rect className="h-64" />
          <Skeleton.Rect className="h-64" />
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Pedidos Ativos', value: data.activeRequests, icon: <FileText className="h-4 w-4 text-primary-600" />, iconBg: 'bg-primary-50' },
    { label: 'Propostas', value: data.totalProposals, icon: <MessageSquare className="h-4 w-4 text-secondary-600" />, iconBg: 'bg-secondary-50' },
    { label: 'Concluídos', value: data.completedRequests, icon: <CheckCircle2 className="h-4 w-4 text-leaf-600" />, iconBg: 'bg-leaf-50' },
    { label: 'Total Gasto', value: data.totalSpent ?? 0, prefix: '€', decimals: 2, icon: <DollarSign className="h-4 w-4 text-warning-600" />, iconBg: 'bg-warning-50' },
  ];

  return (
    <div className="space-y-6">
      <DashboardStatCards stats={stats} />

      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">Pedidos Ativos</h3>
        <ActiveRequestCards requests={data.recentRequests} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <ActivityTimeline notifications={data.recentNotifications} />
        </div>
        <NextActionsPanel requests={data.recentRequests} />
      </div>
    </div>
  );
}
