import { useQuery } from '@tanstack/react-query';
import { FileText, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { getClientDashboardStats } from '@/api/dashboard';
import { DashboardStatCards } from './DashboardStatCards';
import { ActiveRequestsMap } from './ActiveRequestsMap';
import { ActivityTimeline } from './ActivityTimeline';
import { RecentRequests } from './RecentRequests';
import { Skeleton } from '@/components/ui/Skeleton';

export function ClientDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['client-dashboard'],
    queryFn: getClientDashboardStats,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton.Stat key={i} />
          ))}
        </div>
        <Skeleton.Rect className="h-[300px] md:h-[60vh]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton.Rect className="h-64" />
          <Skeleton.Rect className="h-64" />
        </div>
      </div>
    );
  }

  const activeCount = data.activeRequests.length;
  const awaitingCount = data.activeRequests.filter((r) => r.status === 'AWAITING_CONFIRMATION').length;

  const stats = [
    { label: 'Total de pedidos', value: data.totalRequests, icon: <FileText className="h-4 w-4 text-primary-600" />, iconBg: 'bg-primary-50' },
    { label: 'Pedidos ativos', value: activeCount, icon: <Clock className="h-4 w-4 text-secondary-600" />, iconBg: 'bg-secondary-50' },
    { label: 'Concluídos', value: data.completedCount, icon: <CheckCircle2 className="h-4 w-4 text-leaf-600" />, iconBg: 'bg-leaf-50' },
    { label: 'A confirmar', value: awaitingCount, icon: <TrendingUp className="h-4 w-4 text-warning-600" />, iconBg: 'bg-warning-50' },
  ];

  return (
    <div className="space-y-6">
      <DashboardStatCards stats={stats} />
      <ActiveRequestsMap activeCount={activeCount} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <ActivityTimeline notifications={data.recentNotifications} />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <RecentRequests requests={data.activeRequests} />
        </div>
      </div>
    </div>
  );
}
