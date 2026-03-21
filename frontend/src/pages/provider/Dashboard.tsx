import { useQuery } from '@tanstack/react-query';
import { Briefcase, TrendingUp, AlertTriangle, Wrench } from 'lucide-react';
import { getProviderDashboardStats } from '@/api/dashboard';
import { AnimatedPage } from '@/components/AnimatedPage';
import { DashboardStatCards } from '@/features/dashboard/components/DashboardStatCards';
import { RevenueChart } from '@/features/dashboard/components/RevenueChart';
import { JobStatusChart } from '@/features/dashboard/components/JobStatusChart';
import { ProviderAlerts } from '@/features/dashboard/components/ProviderAlerts';
import { Skeleton } from '@/components/ui/Skeleton';

export function ProviderDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['provider-dashboard'],
    queryFn: getProviderDashboardStats,
  });

  if (isLoading || !data) {
    return (
      <AnimatedPage>
        <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900 mb-6">
          Painel do Prestador
        </h1>
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton.Stat key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton.Rect className="h-[200px]" />
            <Skeleton.Rect className="h-[200px]" />
          </div>
        </div>
      </AnimatedPage>
    );
  }

  const { finance, lowStockItems, maintenanceDueMachines } = data;

  const stats = [
    { label: 'Trabalhos concluídos', value: finance.completedJobs, icon: <Briefcase className="h-4 w-4 text-primary-600" />, iconBg: 'bg-primary-50' },
    { label: 'Ganhos totais', value: finance.totalEarnings, prefix: '€', decimals: 2, icon: <TrendingUp className="h-4 w-4 text-leaf-600" />, iconBg: 'bg-leaf-50' },
    { label: 'Stock baixo', value: lowStockItems.length, icon: <AlertTriangle className="h-4 w-4 text-warning-600" />, iconBg: 'bg-warning-50' },
    { label: 'Manutenção pendente', value: maintenanceDueMachines.length, icon: <Wrench className="h-4 w-4 text-danger-600" />, iconBg: 'bg-danger-50' },
  ];

  // Generate placeholder revenue data from the finance summary
  // In a real implementation, this would come from a time-series API endpoint
  const revenueData = finance.thisMonthEarnings > 0
    ? [
        { label: 'Anterior', value: Math.round(finance.totalEarnings - finance.thisMonthEarnings) },
        { label: 'Este mês', value: Math.round(finance.thisMonthEarnings) },
      ]
    : [];

  const jobStatusData = [
    { name: 'Em progresso', value: finance.completedJobs > 0 ? Math.max(1, Math.round(finance.completedJobs * 0.15)) : 0, color: '#2D8A2D' },
    { name: 'Concluídos', value: finance.completedJobs, color: '#3FA517' },
    { name: 'Em disputa', value: 0, color: '#E24B4A' },
  ];
  const jobStatusTotal = jobStatusData.reduce((sum, d) => sum + d.value, 0);

  return (
    <AnimatedPage>
      <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900 mb-6">
        Painel do Prestador
      </h1>
      <div className="space-y-6">
        <ProviderAlerts lowStockItems={lowStockItems} maintenanceDueMachines={maintenanceDueMachines} />
        <DashboardStatCards stats={stats} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-neutral-800 mb-3">Receitas</h3>
            <RevenueChart data={revenueData} />
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-neutral-800 mb-3">Estado dos trabalhos</h3>
            <JobStatusChart data={jobStatusData} total={jobStatusTotal} />
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
