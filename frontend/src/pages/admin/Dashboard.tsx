import { useQuery } from '@tanstack/react-query';
import { getAdminDashboard, listDisputes } from '@/api/admin';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Loader2, Users, FileText, DollarSign, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
  });

  const { data: disputes } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => listDisputes(),
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-neutral-900 mb-6">Administração</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Utilizadores" value={dashboard?.totalUsers ?? 0} sub={`${dashboard?.totalClients ?? 0} clientes / ${dashboard?.totalProviders ?? 0} prestadores`} />
        <StatCard icon={FileText} label="Pedidos" value={dashboard?.totalRequests ?? 0} sub={`${dashboard?.activeRequests ?? 0} ativos`} />
        <StatCard icon={DollarSign} label="Volume total" value={`€${dashboard?.totalVolume?.toFixed(2) ?? '0.00'}`} sub={`€${dashboard?.totalCommissions?.toFixed(2) ?? '0.00'} comissões`} />
        <StatCard icon={Star} label="Rating médio" value={dashboard?.avgPlatformRating?.toFixed(1) ?? '0.0'} sub={`${dashboard?.pendingDisputes ?? 0} disputas pendentes`} />
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-neutral-900 text-sm">Disputas pendentes</h2></CardHeader>
        {disputes?.content && disputes.content.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-6 py-3 font-medium">Pedido</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Prestador</th>
                <th className="px-6 py-3 font-medium">Valor</th>
                <th className="px-6 py-3 font-medium">Data</th>
              </tr></thead>
              <tbody>
                {disputes.content.map((d) => (
                  <tr key={d.requestId} className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50" onClick={() => navigate(`/requests/${d.requestId}`)}>
                    <td className="px-6 py-3 font-medium text-neutral-900">{d.requestTitle}</td>
                    <td className="px-6 py-3 text-neutral-600">{d.clientName}</td>
                    <td className="px-6 py-3 text-neutral-600">{d.providerName}</td>
                    <td className="px-6 py-3 font-medium">€{d.amount.toFixed(2)}</td>
                    <td className="px-6 py-3 text-neutral-500">{new Date(d.createdAt).toLocaleDateString('pt-PT')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <CardBody><p className="text-sm text-neutral-500 text-center py-4">Sem disputas pendentes.</p></CardBody>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card><CardBody>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-neutral-100 text-neutral-700"><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="text-lg font-bold text-neutral-900">{value}</p>
          {sub && <p className="text-xs text-neutral-400">{sub}</p>}
        </div>
      </div>
    </CardBody></Card>
  );
}
