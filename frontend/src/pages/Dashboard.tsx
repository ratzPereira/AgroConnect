import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AnimatedPage } from '@/components/AnimatedPage';
import { ClientDashboard } from '@/features/dashboard/components/ClientDashboard';
import { ProviderDashboard } from '@/pages/provider/Dashboard';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 19) return 'Boa tarde';
  return 'Boa noite';
}

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? 'utilizador';
  const role = user?.role;

  const isProvider = role === 'PROVIDER_MANAGER' || role === 'PROVIDER_LEAD' || role === 'PROVIDER_OPERATOR';

  if (role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <AnimatedPage>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Aqui está um resumo da sua atividade.
        </p>
      </div>
      {isProvider ? <ProviderDashboard inline /> : <ClientDashboard />}
    </AnimatedPage>
  );
}
