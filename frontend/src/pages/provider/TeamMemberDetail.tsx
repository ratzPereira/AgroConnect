import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTeamMember,
  getOperatorAnalytics,
  listOperatorJobs,
  updateTeamMember,
  deactivateTeamMember,
} from '@/api/teamMembers';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { AnimatedPage } from '@/components/AnimatedPage';
import { ArrowLeft, Pencil, UserMinus, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { TeamMemberRole, UpdateTeamMemberRequest } from '@/types/teamMember';

const roleLabels: Record<TeamMemberRole, string> = {
  MANAGER: 'Gestor', LEAD: 'Chefe', OPERATOR: 'Operador',
};
const roleColors: Record<TeamMemberRole, string> = {
  MANAGER: 'bg-purple-100 text-purple-700',
  LEAD: 'bg-blue-100 text-blue-700',
  OPERATOR: 'bg-neutral-100 text-neutral-700',
};

const INPUT_CLASS = 'rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full';

const currency = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

type ActionKind = 'edit' | 'deactivate' | null;

export function TeamMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const operatorId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);
  const startOfYear = `${new Date().getFullYear()}-01-01`;
  const [from, setFrom] = useState<string>(startOfYear);
  const [to, setTo] = useState<string>(today);

  const [action, setAction] = useState<ActionKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobsPage, setJobsPage] = useState(0);

  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['team-members', operatorId],
    queryFn: () => getTeamMember(operatorId),
    enabled: Number.isFinite(operatorId),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['team-members', operatorId, 'analytics', from, to],
    queryFn: () => getOperatorAnalytics(operatorId, from, to),
    enabled: Number.isFinite(operatorId),
  });

  const { data: jobsPageData, isLoading: jobsLoading } = useQuery({
    queryKey: ['team-members', operatorId, 'jobs', from, to, jobsPage],
    queryFn: () => listOperatorJobs(operatorId, from, to, jobsPage, 10),
    enabled: Number.isFinite(operatorId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['team-members'] });

  const handleError = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } } };
    setError(err?.response?.data?.message ?? 'Não foi possível concluir a operação.');
  };

  const updateMut = useMutation({
    mutationFn: (data: UpdateTeamMemberRequest) => updateTeamMember(operatorId, data),
    onSuccess: () => { invalidate(); setAction(null); setError(null); },
    onError: handleError,
  });

  const deactivateMut = useMutation({
    mutationFn: () => deactivateTeamMember(operatorId),
    onSuccess: () => { invalidate(); navigate('/provider/team'); },
    onError: handleError,
  });

  if (memberLoading || !member) {
    return (
      <AnimatedPage>
        <Skeleton.Card />
      </AnimatedPage>
    );
  }

  const closeAction = () => { setAction(null); setError(null); };

  return (
    <AnimatedPage>
      <button
        onClick={() => navigate('/provider/team')}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à equipa
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-neutral-900 truncate">{member.name}</h1>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', roleColors[member.role])}>
              {roleLabels[member.role]}
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            {[member.email, member.phone].filter(Boolean).join(' • ') || 'Sem contactos'}
          </p>
          <p className="text-xs font-medium text-neutral-700 mt-1">
            {member.hourlyRate != null
              ? `${Number(member.hourlyRate).toFixed(2)} €/h`
              : <span className="text-neutral-400">Sem taxa horária</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setAction('edit')}>
            <Pencil className="h-4 w-4" />Editar
          </Button>
          {member.active && (
            <Button size="sm" variant="danger" onClick={() => setAction('deactivate')}>
              <UserMinus className="h-4 w-4" />Desativar
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-600">De</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={cn(INPUT_CLASS, 'w-auto')}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-600">Até</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={cn(INPUT_CLASS, 'w-auto')}
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="ghost" onClick={() => { setFrom(startOfYear); setTo(today); }}>
                Ano atual
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {analyticsLoading || !analytics ? (
        <Skeleton.Card />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Trabalhos" value={String(analytics.jobsDone)} />
          <StatCard label="Horas trabalhadas" value={`${analytics.hoursWorked} h`} />
          <StatCard label="Custo mão-de-obra" value={currency(analytics.laborCost)} />
          <StatCard label="Receita atribuída" value={currency(analytics.revenueAttributed)} hint="preço / nº operadores" />
          <StatCard
            label="Lucro"
            value={currency(analytics.profit)}
            hint="Receita − mão-de-obra"
          />
          <StatCard label="Lucro / hora" value={currency(analytics.profitPerHour)} />
          <StatCard label="Lucro / trabalho" value={currency(analytics.profitPerJob)} />
          <StatCard
            label="Máquinas usadas"
            value={String(analytics.topMachines.length)}
            hint="distintas no período"
          />
        </div>
      )}

      {analytics && analytics.topMachines.length > 0 && (
        <Card className="mb-6">
          <CardBody>
            <h2 className="text-sm font-semibold text-neutral-700 mb-3">Máquinas mais usadas</h2>
            <div className="space-y-2">
              {analytics.topMachines.map((m) => (
                <div
                  key={m.machineId}
                  className="flex items-center justify-between text-sm border-b border-neutral-100 last:border-b-0 py-2"
                >
                  <span className="text-neutral-800 font-medium truncate">{m.machineName}</span>
                  <span className="text-neutral-500 text-xs">
                    {m.jobsCount} {m.jobsCount === 1 ? 'trabalho' : 'trabalhos'} • {m.machineHours} h
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <h2 className="text-sm font-semibold text-neutral-700 mb-3">Trabalhos realizados</h2>
      {jobsLoading ? (
        <Skeleton.Table />
      ) : jobsPageData && jobsPageData.content.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-3 sm:px-6 py-3 font-medium">Cliente</th>
                <th className="hidden sm:table-cell px-6 py-3 font-medium">Máquina</th>
                <th className="px-3 sm:px-6 py-3 font-medium">Horas</th>
                <th className="hidden sm:table-cell px-6 py-3 font-medium">Custo</th>
                <th className="px-3 sm:px-6 py-3 font-medium">Receita</th>
                <th className="px-3 sm:px-6 py-3 font-medium">Concluído</th>
              </tr></thead>
              <tbody>
                {jobsPageData.content.map((job) => (
                  <tr
                    key={job.executionId}
                    className={cn(
                      'border-b border-neutral-100',
                      job.requestId && 'hover:bg-neutral-50 cursor-pointer',
                    )}
                    onClick={
                      job.requestId
                        ? () => navigate(`/requests/${job.requestId}`)
                        : undefined
                    }
                  >
                    <td className="px-3 sm:px-6 py-3 text-neutral-900">{job.clientName ?? '—'}</td>
                    <td className="hidden sm:table-cell px-6 py-3 text-neutral-600">{job.machineName ?? '—'}</td>
                    <td className="px-3 sm:px-6 py-3 text-neutral-600">{job.hoursWorked} h</td>
                    <td className="hidden sm:table-cell px-6 py-3 text-neutral-600">{currency(job.laborCost)}</td>
                    <td className="px-3 sm:px-6 py-3 text-leaf-700 font-medium">{currency(job.revenueAttributed)}</td>
                    <td className="px-3 sm:px-6 py-3 text-neutral-500 text-xs">
                      {job.completedAt ? new Date(job.completedAt).toLocaleDateString('pt-PT') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {jobsPageData.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
              <span className="text-xs text-neutral-500">
                Página {jobsPageData.number + 1} de {jobsPageData.totalPages} ({jobsPageData.totalElements} trabalhos)
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" disabled={jobsPageData.first} onClick={() => setJobsPage((p) => Math.max(0, p - 1))}>Anterior</Button>
                <Button size="sm" variant="ghost" disabled={jobsPageData.last} onClick={() => setJobsPage((p) => p + 1)}>Seguinte</Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card><CardBody>
          <p className="text-sm text-neutral-500 text-center py-8">Sem trabalhos no período.</p>
        </CardBody></Card>
      )}

      {/* Edit member modal */}
      <Modal open={action === 'edit'} onClose={closeAction} title="Editar membro">
        <form
          className="p-6 space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const rateRaw = (fd.get('hourlyRate') as string).trim();
            updateMut.mutate({
              name: fd.get('name') as string,
              phone: (fd.get('phone') as string) || undefined,
              role: fd.get('role') as TeamMemberRole,
              hourlyRate: rateRaw === '' ? null : Number(rateRaw),
            });
          }}
        >
          {error && <Alert variant="danger">{error}</Alert>}
          <FormField label="Nome">
            <input name="name" defaultValue={member.name} required className={INPUT_CLASS} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Telefone">
              <input name="phone" defaultValue={member.phone ?? ''} className={INPUT_CLASS} />
            </FormField>
            <FormField label="Função">
              <select name="role" defaultValue={member.role} className={INPUT_CLASS}>
                <option value="OPERATOR">Operador</option>
                <option value="LEAD">Chefe</option>
                <option value="MANAGER">Gestor</option>
              </select>
            </FormField>
          </div>
          <FormField label="Taxa horária (€/h)">
            <input
              name="hourlyRate"
              type="number"
              min="0"
              step="0.01"
              defaultValue={member.hourlyRate != null ? String(member.hourlyRate) : ''}
              className={INPUT_CLASS}
            />
          </FormField>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={closeAction}>Cancelar</Button>
            <Button type="submit" loading={updateMut.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate confirmation */}
      <Modal open={action === 'deactivate'} onClose={closeAction} title="Desativar membro">
        <div className="p-6 space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="flex items-start gap-3 text-sm text-neutral-700">
            <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-neutral-900">Desativar &quot;{member.name}&quot;?</p>
              <p className="text-neutral-500 mt-1">
                O membro deixará de aparecer na equipa ativa. O histórico de trabalhos é preservado.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={closeAction}>Cancelar</Button>
            <Button type="button" variant="danger" loading={deactivateMut.isPending} onClick={() => deactivateMut.mutate()}>
              Desativar
            </Button>
          </div>
        </div>
      </Modal>
    </AnimatedPage>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs text-neutral-500 mb-1">{label}</p>
        <p className="text-lg font-semibold text-neutral-900">{value}</p>
        {hint && <p className="text-xs text-neutral-400 mt-1">{hint}</p>}
      </CardBody>
    </Card>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-neutral-700">{label}</label>
      {children}
    </div>
  );
}
