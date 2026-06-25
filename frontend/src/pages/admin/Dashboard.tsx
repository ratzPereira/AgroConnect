import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, DollarSign, Star, ShoppingBag, Percent, ShieldAlert, Gavel,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getAdminDashboard, getAdminAnalytics, listDisputes } from '@/api/admin';
import { AnimatedPage } from '@/components/AnimatedPage';
import { DashboardStatCards } from '@/features/dashboard/components/DashboardStatCards';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { ResolveDisputeModal } from '@/features/admin/components/ResolveDisputeModal';
import type { AdminDispute } from '@/types/admin';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho', PUBLISHED: 'Publicado', WITH_PROPOSALS: 'Com propostas',
  AWARDED: 'Adjudicado', IN_PROGRESS: 'Em curso', AWAITING_CONFIRMATION: 'Aguarda confirmação',
  COMPLETED: 'Concluído', RATED: 'Avaliado', DISPUTED: 'Em disputa',
  EXPIRED: 'Expirado', CANCELLED: 'Cancelado',
};
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', CLIENT: 'Cliente', PROVIDER_MANAGER: 'Prestador',
  PROVIDER_LEAD: 'Chefe de equipa', PROVIDER_OPERATOR: 'Operador',
};
const STATUS_COLORS = ['#94A3B8', '#3B82F6', '#6366F1', '#0EA5E9', '#F59E0B', '#EAB308', '#16A34A', '#0F766E', '#DC2626', '#A1A1AA', '#F97316'];
const ROLE_COLORS = ['#DC2626', '#16A34A', '#0F766E', '#0EA5E9', '#94A3B8'];

const TOOLTIP_STYLE = {
  background: 'white', border: '1px solid #E8E6E0', borderRadius: '8px', fontSize: '12px',
} as const;

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function ChartCard({ title, subtitle, children }: { readonly title: string; readonly subtitle?: string; readonly children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-neutral-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(null);

  const { data: dashboard, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: getAdminDashboard });
  const { data: analytics } = useQuery({ queryKey: ['admin-analytics'], queryFn: getAdminAnalytics });
  const { data: disputes, isLoading: disputesLoading } = useQuery({ queryKey: ['admin-disputes'], queryFn: () => listDisputes() });

  const activityData = useMemo(() => {
    if (!analytics) return [];
    return analytics.registrationsDaily.map((r, i) => ({
      date: shortDate(r.date),
      registos: r.count,
      pedidos: analytics.requestsDaily[i]?.count ?? 0,
    }));
  }, [analytics]);

  const revenueData = useMemo(() => {
    if (!analytics) return [];
    return analytics.revenueDaily.map((r) => ({
      date: shortDate(r.date),
      volume: Math.round(r.amount),
      comissao: Math.round(r.commission),
    }));
  }, [analytics]);

  const statusData = useMemo(() => {
    if (!analytics) return [];
    return analytics.requestsByStatus
      .filter((s) => s.count > 0)
      .map((s, i) => ({ name: STATUS_LABELS[s.label] ?? s.label, value: s.count, color: STATUS_COLORS[i % STATUS_COLORS.length] }));
  }, [analytics]);

  const roleData = useMemo(() => {
    if (!analytics) return [];
    return analytics.usersByRole
      .filter((r) => r.count > 0)
      .map((r, i) => ({ name: ROLE_LABELS[r.label] ?? r.label, value: r.count, color: ROLE_COLORS[i % ROLE_COLORS.length] }));
  }, [analytics]);

  if (isLoading) {
    return (
      <AnimatedPage>
        <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900 mb-6">Administração</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {['s0', 's1', 's2', 's3'].map((k) => <Skeleton.Stat key={k} />)}
        </div>
        <Skeleton.Table />
      </AnimatedPage>
    );
  }

  const stats = [
    { label: 'Utilizadores', value: dashboard?.totalUsers ?? 0, icon: <Users className="h-4 w-4 text-secondary-600" />, iconBg: 'bg-secondary-50' },
    { label: 'Pedidos', value: dashboard?.totalRequests ?? 0, icon: <FileText className="h-4 w-4 text-primary-600" />, iconBg: 'bg-primary-50' },
    { label: 'Volume total', value: dashboard?.totalVolume ?? 0, prefix: '€', decimals: 2, icon: <DollarSign className="h-4 w-4 text-leaf-600" />, iconBg: 'bg-leaf-50' },
    { label: 'Comissões', value: dashboard?.totalCommissions ?? 0, prefix: '€', decimals: 2, icon: <Percent className="h-4 w-4 text-leaf-600" />, iconBg: 'bg-leaf-50' },
    { label: 'Rating médio', value: dashboard?.avgPlatformRating ?? 0, decimals: 1, icon: <Star className="h-4 w-4 text-warning-600" />, iconBg: 'bg-warning-50' },
    { label: 'Anúncios ativos', value: dashboard?.activeListings ?? 0, icon: <ShoppingBag className="h-4 w-4 text-secondary-600" />, iconBg: 'bg-secondary-50' },
    { label: 'Pedidos ativos', value: dashboard?.activeRequests ?? 0, icon: <FileText className="h-4 w-4 text-primary-600" />, iconBg: 'bg-primary-50' },
    { label: 'Disputas pendentes', value: dashboard?.pendingDisputes ?? 0, icon: <ShieldAlert className="h-4 w-4 text-danger-600" />, iconBg: 'bg-danger-50' },
  ];

  const disputeList = disputes?.content ?? [];

  return (
    <AnimatedPage>
      <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900 mb-6">Administração</h1>

      <div className="mb-6">
        <DashboardStatCards stats={stats} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <ChartCard title="Atividade da plataforma" subtitle="Registos e pedidos · últimos 14 dias">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F1EFEA" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8F8C82' }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: '#8F8C82' }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="registos" name="Registos" stroke="#0EA5E9" strokeWidth={2} fill="url(#gReg)" />
                <Area type="monotone" dataKey="pedidos" name="Pedidos" stroke="#16A34A" strokeWidth={2} fill="url(#gReq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Volume transacionado" subtitle="Volume e comissões (€) · últimos 14 dias">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#F1EFEA" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8F8C82' }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: '#8F8C82' }} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `€${Number(v).toLocaleString('pt-PT')}`} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="volume" name="Volume" fill="#0F766E" radius={[3, 3, 0, 0]} />
                <Bar dataKey="comissao" name="Comissão" fill="#94A3B8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Pedidos por estado" subtitle="Distribuição atual">
          <DistributionPie data={statusData} />
        </ChartCard>

        <ChartCard title="Utilizadores por papel" subtitle="Distribuição atual">
          <DistributionPie data={roleData} />
        </ChartCard>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-neutral-100">
          <Gavel className="h-4 w-4 text-warning-600" />
          <h2 className="text-sm font-semibold text-neutral-900">Disputas pendentes</h2>
          {disputeList.length > 0 && (
            <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-danger-50 text-danger-700">{disputeList.length}</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-5 py-3 font-medium">Pedido</th>
              <th className="hidden sm:table-cell px-5 py-3 font-medium">Cliente</th>
              <th className="hidden sm:table-cell px-5 py-3 font-medium">Prestador</th>
              <th className="px-5 py-3 font-medium">Valor</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody>
              {disputesLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-neutral-400">A carregar…</td></tr>
              ) : disputeList.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-neutral-500">Sem disputas pendentes. Tudo em ordem. ✅</td></tr>
              ) : disputeList.map((d) => (
                <tr key={d.requestId} className="border-b border-neutral-100 hover:bg-neutral-50/60">
                  <td className="px-5 py-3 font-medium text-neutral-900">
                    <button type="button" className="hover:text-primary-600" onClick={() => navigate(`/requests/${d.requestId}`)}>{d.requestTitle}</button>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-3 text-neutral-600">{d.clientName}</td>
                  <td className="hidden sm:table-cell px-5 py-3 text-neutral-600">{d.providerName}</td>
                  <td className="px-5 py-3 font-semibold text-neutral-900 tabular-nums">€{d.amount.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant="primary" onClick={() => setSelectedDispute(d)}>
                      <Gavel className="h-3.5 w-3.5" /><span className="hidden sm:inline">Resolver</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ResolveDisputeModal key={selectedDispute?.requestId ?? 'none'} open={selectedDispute !== null} onClose={() => setSelectedDispute(null)} dispute={selectedDispute} />
    </AnimatedPage>
  );
}

function DistributionPie({ data }: { readonly data: ReadonlyArray<{ name: string; value: number; color: string }> }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[220px] text-sm text-neutral-500">Sem dados disponíveis</div>;
  }
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={[...data]} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="value">
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [value ?? 0, name ?? '']} />
          <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
