import { useQuery } from '@tanstack/react-query';
import { Briefcase, TrendingUp, AlertTriangle, Wrench } from 'lucide-react';
import { getProviderDashboardStats, getProviderActiveJobs } from '@/api/dashboard';
import { getMonthlyBreakdown } from '@/api/finance';
import { getRequestPins } from '@/api/pins';
import { AnimatedPage } from '@/components/AnimatedPage';
import { AzoresMap } from '@/components/AzoresMap';
import { DashboardStatCards } from '@/features/dashboard/components/DashboardStatCards';
import { DashboardRevenueChart } from '@/features/dashboard/components/DashboardRevenueChart';
import { ProviderAlerts } from '@/features/dashboard/components/ProviderAlerts';
import { ProviderJobsList } from '@/features/dashboard/components/ProviderJobsList';
import { UpcomingJobsMini } from '@/features/calendar/components/UpcomingJobsMini';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGeolocation } from '@/hooks/useGeolocation';

interface ProviderDashboardProps {
  readonly inline?: boolean;
}

export function ProviderDashboard({ inline }: ProviderDashboardProps) {
  const geo = useGeolocation(true);

  const { data, isLoading } = useQuery({
    queryKey: ['provider-dashboard'],
    queryFn: getProviderDashboardStats,
    refetchOnMount: 'always',
  });

  const { data: pins } = useQuery({
    queryKey: ['request-pins'],
    queryFn: getRequestPins,
    refetchOnMount: 'always',
  });

  const { data: activeJobs } = useQuery({
    queryKey: ['provider-active-jobs'],
    queryFn: getProviderActiveJobs,
    refetchOnMount: 'always',
  });

  const { data: monthlyBreakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ['provider-dashboard-monthly-breakdown'],
    queryFn: () => getMonthlyBreakdown(),
    refetchOnMount: 'always',
  });

  const Wrapper = inline ? 'div' : AnimatedPage;

  if (isLoading || !data) {
    return (
      <Wrapper>
        {!inline && (
          <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900 mb-6">
            Painel do Prestador
          </h1>
        )}
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {['ss-0', 'ss-1', 'ss-2', 'ss-3'].map(k => (
              <Skeleton.Stat key={k} />
            ))}
          </div>
          <Skeleton.Rect className="h-[420px]" />
          <Skeleton.Rect className="h-[300px]" />
        </div>
      </Wrapper>
    );
  }

  const { finance, lowStockItems, maintenanceDueMachines } = data;

  const stats = [
    { label: 'Trabalhos Ativos', value: activeJobs?.length ?? 0, icon: <Briefcase className="h-4 w-4 text-primary-600" />, iconBg: 'bg-primary-50' },
    { label: 'Ganhos este mês', value: finance.thisMonthEarnings, prefix: '€', decimals: 2, icon: <TrendingUp className="h-4 w-4 text-leaf-600" />, iconBg: 'bg-leaf-50' },
    { label: 'Stock baixo', value: lowStockItems.length, icon: <AlertTriangle className="h-4 w-4 text-warning-600" />, iconBg: 'bg-warning-50' },
    { label: 'Manutenção pendente', value: maintenanceDueMachines.length, icon: <Wrench className="h-4 w-4 text-danger-600" />, iconBg: 'bg-danger-50' },
  ];

  const providerLocation = geo.latitude && geo.longitude
    ? { latitude: geo.latitude, longitude: geo.longitude, radiusKm: 50 }
    : undefined;

  return (
    <Wrapper>
      {!inline && (
        <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900 mb-6">
          Painel do Prestador
        </h1>
      )}
      <div className="space-y-6">
        <ProviderAlerts lowStockItems={lowStockItems} maintenanceDueMachines={maintenanceDueMachines} />
        <DashboardStatCards stats={stats} />

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">Pedidos na Zona</h3>
            <p className="text-xs text-neutral-500">Os pedidos publicados perto de si</p>
          </div>
          <AzoresMap
            pins={pins ?? []}
            providerLocation={providerLocation}
            height="420px"
            colorBy="status"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProviderJobsList jobs={activeJobs ?? []} />
          <UpcomingJobsMini />
        </div>

        <DashboardRevenueChart breakdown={monthlyBreakdown} isLoading={breakdownLoading} />
      </div>
    </Wrapper>
  );
}
