import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  getMachine,
  getMachineAnalytics,
  listMachineJobs,
  listMaintenance,
  createMaintenance,
  deleteMaintenance,
  listMachineExpenses,
  createMachineExpense,
  deleteMachineExpense,
  updateMachine,
  deleteMachine,
} from '@/api/machines';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { AnimatedPage } from '@/components/AnimatedPage';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  AlertTriangle,
  Wrench,
  Fuel,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type {
  ExpenseCategory,
  MaintenanceType,
  MachineStatus,
  UpdateMachineRequest,
  CreateMaintenanceLogRequest,
  CreateMachineExpenseRequest,
} from '@/types/machine';

const statusLabels: Record<MachineStatus, string> = {
  AVAILABLE: 'Disponível',
  IN_USE: 'Em uso',
  MAINTENANCE: 'Manutenção',
  RETIRED: 'Retirada',
};
const statusColors: Record<MachineStatus, string> = {
  AVAILABLE: 'bg-leaf-100 text-leaf-700',
  IN_USE: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-warning-100 text-warning-700',
  RETIRED: 'bg-neutral-100 text-neutral-500',
};

const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  ROUTINE: 'Rotina',
  REPAIR: 'Reparação',
  INSPECTION: 'Inspeção',
};

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  FUEL: 'Combustível',
  PARTS: 'Peças',
  INSURANCE: 'Seguro',
  TAX: 'Imposto',
  OTHER: 'Outro',
};

const INPUT_CLASS = 'rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full';

const currency = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

type ActionKind = 'edit' | 'delete' | 'new-maintenance' | 'new-expense' | null;

export function MachineDetail() {
  const { id } = useParams<{ id: string }>();
  const machineId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);
  const startOfYear = `${new Date().getFullYear()}-01-01`;
  const [from, setFrom] = useState<string>(startOfYear);
  const [to, setTo] = useState<string>(today);

  const [action, setAction] = useState<ActionKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobsPage, setJobsPage] = useState(0);

  const { data: machine, isLoading: machineLoading } = useQuery({
    queryKey: ['machines', machineId],
    queryFn: () => getMachine(machineId),
    enabled: Number.isFinite(machineId),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['machines', machineId, 'analytics', from, to],
    queryFn: () => getMachineAnalytics(machineId, from, to),
    enabled: Number.isFinite(machineId),
  });

  const { data: jobsPageData, isLoading: jobsLoading } = useQuery({
    queryKey: ['machines', machineId, 'jobs', from, to, jobsPage],
    queryFn: () => listMachineJobs(machineId, from, to, jobsPage, 10),
    enabled: Number.isFinite(machineId),
  });

  const { data: maintenanceList, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['machines', machineId, 'maintenance'],
    queryFn: () => listMaintenance(machineId),
    enabled: Number.isFinite(machineId),
  });

  const { data: expensesList, isLoading: expensesLoading } = useQuery({
    queryKey: ['machines', machineId, 'expenses'],
    queryFn: () => listMachineExpenses(machineId),
    enabled: Number.isFinite(machineId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['machines'] });
  };

  const handleError = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } } };
    setError(err?.response?.data?.message ?? 'Não foi possível concluir a operação.');
  };

  const updateMut = useMutation({
    mutationFn: (data: UpdateMachineRequest) => updateMachine(machineId, data),
    onSuccess: () => { invalidate(); setAction(null); setError(null); },
    onError: handleError,
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteMachine(machineId),
    onSuccess: () => { invalidate(); navigate('/provider/machines'); },
    onError: handleError,
  });

  const createMaintenanceMut = useMutation({
    mutationFn: (data: CreateMaintenanceLogRequest) => createMaintenance(machineId, data),
    onSuccess: () => { invalidate(); setAction(null); setError(null); },
    onError: handleError,
  });

  const deleteMaintenanceMut = useMutation({
    mutationFn: (logId: number) => deleteMaintenance(machineId, logId),
    onSuccess: () => invalidate(),
    onError: handleError,
  });

  const createExpenseMut = useMutation({
    mutationFn: (data: CreateMachineExpenseRequest) => createMachineExpense(machineId, data),
    onSuccess: () => { invalidate(); setAction(null); setError(null); },
    onError: handleError,
  });

  const deleteExpenseMut = useMutation({
    mutationFn: (expenseId: number) => deleteMachineExpense(machineId, expenseId),
    onSuccess: () => invalidate(),
    onError: handleError,
  });

  const chartData = useMemo(() => {
    if (!jobsPageData) return [];
    const buckets = new Map<string, { label: string; jobs: number; revenue: number }>();
    for (const job of jobsPageData.content) {
      if (!job.completedAt) continue;
      const monthKey = job.completedAt.slice(0, 7);
      const existing = buckets.get(monthKey) ?? { label: monthKey, jobs: 0, revenue: 0 };
      existing.jobs += 1;
      existing.revenue += job.revenue;
      buckets.set(monthKey, existing);
    }
    return Array.from(buckets.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [jobsPageData]);

  if (machineLoading || !machine) {
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
        onClick={() => navigate('/provider/machines')}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às máquinas
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-neutral-900 truncate">{machine.name}</h1>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColors[machine.status])}>
              {statusLabels[machine.status]}
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            {[machine.type, machine.licensePlate].filter(Boolean).join(' • ') || 'Sem detalhes adicionais'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setAction('edit')}>
            <Pencil className="h-4 w-4" />Editar
          </Button>
          {machine.status === 'RETIRED' && (
            <Button size="sm" variant="danger" onClick={() => setAction('delete')}>
              <Trash2 className="h-4 w-4" />Eliminar
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label htmlFor="md-from" className="block text-xs font-medium text-neutral-600">De</label>
              <input
                id="md-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={cn(INPUT_CLASS, 'w-auto')}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="md-to" className="block text-xs font-medium text-neutral-600">Até</label>
              <input
                id="md-to"
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
          <StatCard label="Horas máquina" value={`${analytics.machineHours} h`} />
          <StatCard label="Utilização" value={`${analytics.utilizationPercent}%`} hint="hrs / (dias × 8h)" />
          <StatCard label="Receita" value={currency(analytics.revenue)} />
          <StatCard label="Manutenção" value={currency(analytics.maintenanceCost)} hint={`${analytics.maintenanceCount} registos`} />
          <StatCard label="Despesas" value={currency(analytics.expensesCost)} />
          <StatCard
            label="Contribuição líquida"
            value={currency(analytics.netContribution)}
            hint="Receita − Manutenção − Despesas"
          />
          <StatCard
            label="Próx. manutenção"
            value={analytics.nextMaintenanceAt ?? '—'}
          />
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'overview', label: 'Visão geral' },
          { id: 'jobs', label: 'Trabalhos' },
          { id: 'maintenance', label: 'Manutenções' },
          { id: 'expenses', label: 'Despesas' },
        ]}
        defaultValue="overview"
      >
        {(activeTab) => (
          <>
            {activeTab === 'overview' && (
              <Card><CardBody>
                <h2 className="text-sm font-semibold text-neutral-700 mb-3">Trabalhos por mês</h2>
                {chartData.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-8">
                    Sem trabalhos no período selecionado.
                  </p>
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8F8C82' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#8F8C82' }} />
                        <Tooltip
                          contentStyle={{
                            background: 'white',
                            border: '1px solid #E8E6E0',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value) => [String(value), 'Trabalhos']}
                        />
                        <Bar dataKey="jobs" fill="#2D8A2D" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardBody></Card>
            )}

            {activeTab === 'jobs' && (
              <>
                {jobsLoading && <Skeleton.Table />}
                {!jobsLoading && jobsPageData && jobsPageData.content.length > 0 && (
                  <Card>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-neutral-200 text-left text-neutral-500">
                          <th className="px-3 sm:px-6 py-3 font-medium">Cliente</th>
                          <th className="hidden sm:table-cell px-6 py-3 font-medium">Horas</th>
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
                              <td className="hidden sm:table-cell px-6 py-3 text-neutral-600">{job.machineHours} h</td>
                              <td className="px-3 sm:px-6 py-3 text-leaf-700 font-medium">{currency(job.revenue)}</td>
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
                )}
                {!jobsLoading && (!jobsPageData || jobsPageData.content.length === 0) && (
                  <Card><CardBody>
                    <p className="text-sm text-neutral-500 text-center py-8">Sem trabalhos no período.</p>
                  </CardBody></Card>
                )}
              </>
            )}

            {activeTab === 'maintenance' && (
              <>
                <div className="flex justify-end mb-3">
                  <Button size="sm" onClick={() => setAction('new-maintenance')}>
                    <Plus className="h-4 w-4" />Adicionar manutenção
                  </Button>
                </div>
                {maintenanceLoading && <Skeleton.Table />}
                {!maintenanceLoading && maintenanceList && maintenanceList.length > 0 && (
                  <div className="space-y-2">
                    {maintenanceList.map((log) => (
                      <Card key={log.id}>
                        <CardBody>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Wrench className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                                <p className="font-medium text-neutral-900 truncate">{log.description}</p>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                                  {maintenanceTypeLabels[log.maintenanceType]}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500">
                                {log.performedAt}
                                {log.workshopName ? ` • ${log.workshopName}` : ''}
                                {log.cost == null ? '' : ` • ${currency(log.cost)}`}
                              </p>
                              {log.nextDueAt && (
                                <p className="text-xs text-neutral-500 mt-0.5">Próx.: {log.nextDueAt}</p>
                              )}
                              {log.notes && <p className="text-xs text-neutral-500 mt-1">{log.notes}</p>}
                              <p className="text-xs text-neutral-400 mt-1">por {log.createdByName ?? '—'}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMaintenanceMut.mutate(log.id)}
                              loading={deleteMaintenanceMut.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
                {!maintenanceLoading && (!maintenanceList || maintenanceList.length === 0) && (
                  <Card><CardBody>
                    <p className="text-sm text-neutral-500 text-center py-8">Sem manutenções registadas.</p>
                  </CardBody></Card>
                )}
              </>
            )}

            {activeTab === 'expenses' && (
              <>
                <div className="flex justify-end mb-3">
                  <Button size="sm" onClick={() => setAction('new-expense')}>
                    <Plus className="h-4 w-4" />Adicionar despesa
                  </Button>
                </div>
                {expensesLoading && <Skeleton.Table />}
                {!expensesLoading && expensesList && expensesList.length > 0 && (
                  <div className="space-y-2">
                    {expensesList.map((exp) => (
                      <Card key={exp.id}>
                        <CardBody>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Fuel className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                                <p className="font-medium text-neutral-900 truncate">
                                  {exp.description ?? expenseCategoryLabels[exp.category]}
                                </p>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-clay-100 text-clay-700">
                                  {expenseCategoryLabels[exp.category]}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500">
                                {exp.incurredAt} • {currency(exp.amount)}
                              </p>
                              {exp.notes && <p className="text-xs text-neutral-500 mt-1">{exp.notes}</p>}
                              <p className="text-xs text-neutral-400 mt-1">por {exp.createdByName ?? '—'}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteExpenseMut.mutate(exp.id)}
                              loading={deleteExpenseMut.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
                {!expensesLoading && (!expensesList || expensesList.length === 0) && (
                  <Card><CardBody>
                    <p className="text-sm text-neutral-500 text-center py-8">Sem despesas registadas.</p>
                  </CardBody></Card>
                )}
              </>
            )}
          </>
        )}
      </Tabs>

      {/* Edit machine modal */}
      <Modal open={action === 'edit'} onClose={closeAction} title="Editar máquina">
        <form
          className="p-6 space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateMut.mutate({
              name: fd.get('name') as string,
              type: (fd.get('type') as string) || undefined,
              description: (fd.get('description') as string) || undefined,
              status: (fd.get('status') as MachineStatus) || undefined,
              licensePlate: (fd.get('licensePlate') as string) || undefined,
            });
          }}
        >
          {error && <Alert variant="danger">{error}</Alert>}
          <FormField label="Nome">
            <input name="name" defaultValue={machine.name} required className={INPUT_CLASS} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Tipo">
              <input name="type" defaultValue={machine.type ?? ''} className={INPUT_CLASS} />
            </FormField>
            <FormField label="Matrícula">
              <input name="licensePlate" defaultValue={machine.licensePlate ?? ''} className={INPUT_CLASS} />
            </FormField>
          </div>
          <FormField label="Descrição">
            <input name="description" defaultValue={machine.description ?? ''} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Estado">
            <select name="status" defaultValue={machine.status} className={INPUT_CLASS}>
              <option value="AVAILABLE">Disponível</option>
              <option value="IN_USE">Em uso</option>
              <option value="MAINTENANCE">Manutenção</option>
              <option value="RETIRED">Retirada</option>
            </select>
          </FormField>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={closeAction}>Cancelar</Button>
            <Button type="submit" loading={updateMut.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={action === 'delete'} onClose={closeAction} title="Eliminar máquina">
        <div className="p-6 space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="flex items-start gap-3 text-sm text-neutral-700">
            <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-neutral-900">Eliminar &quot;{machine.name}&quot;?</p>
              <p className="text-neutral-500 mt-1">
                Só máquinas retiradas podem ser eliminadas. O histórico de manutenções e despesas será removido.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={closeAction}>Cancelar</Button>
            <Button type="button" variant="danger" loading={deleteMut.isPending} onClick={() => deleteMut.mutate()}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* New maintenance modal */}
      <Modal open={action === 'new-maintenance'} onClose={closeAction} title="Registar manutenção">
        <form
          className="p-6 space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const costStr = (fd.get('cost') as string).trim();
            const nextDueRaw = (fd.get('nextDueAt') as string).trim();
            createMaintenanceMut.mutate({
              maintenanceType: fd.get('maintenanceType') as MaintenanceType,
              description: fd.get('description') as string,
              cost: costStr ? Number(costStr) : undefined,
              workshopName: (fd.get('workshopName') as string) || undefined,
              performedAt: fd.get('performedAt') as string,
              nextDueAt: nextDueRaw || undefined,
              notes: (fd.get('notes') as string) || undefined,
            });
          }}
        >
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Tipo">
              <select name="maintenanceType" defaultValue="ROUTINE" className={INPUT_CLASS}>
                <option value="ROUTINE">Rotina</option>
                <option value="REPAIR">Reparação</option>
                <option value="INSPECTION">Inspeção</option>
              </select>
            </FormField>
            <FormField label="Data">
              <input name="performedAt" type="date" defaultValue={today} required className={INPUT_CLASS} />
            </FormField>
          </div>
          <FormField label="Descrição">
            <input name="description" maxLength={500} required className={INPUT_CLASS}
              placeholder="Ex: Mudança de óleo e filtros" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Custo (€, opcional)">
              <input name="cost" type="number" step="0.01" min="0" className={INPUT_CLASS} />
            </FormField>
            <FormField label="Oficina (opcional)">
              <input name="workshopName" maxLength={255} className={INPUT_CLASS} />
            </FormField>
          </div>
          <FormField label="Próxima manutenção (opcional)">
            <input name="nextDueAt" type="date" className={INPUT_CLASS} />
          </FormField>
          <FormField label="Notas (opcional)">
            <input name="notes" maxLength={5000} className={INPUT_CLASS} />
          </FormField>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={closeAction}>Cancelar</Button>
            <Button type="submit" loading={createMaintenanceMut.isPending}>Registar</Button>
          </div>
        </form>
      </Modal>

      {/* New expense modal */}
      <Modal open={action === 'new-expense'} onClose={closeAction} title="Registar despesa">
        <form
          className="p-6 space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            createExpenseMut.mutate({
              category: fd.get('category') as ExpenseCategory,
              description: (fd.get('description') as string) || undefined,
              amount: Number(fd.get('amount')),
              incurredAt: fd.get('incurredAt') as string,
              notes: (fd.get('notes') as string) || undefined,
            });
          }}
        >
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Categoria">
              <select name="category" defaultValue="FUEL" className={INPUT_CLASS}>
                <option value="FUEL">Combustível</option>
                <option value="PARTS">Peças</option>
                <option value="INSURANCE">Seguro</option>
                <option value="TAX">Imposto</option>
                <option value="OTHER">Outro</option>
              </select>
            </FormField>
            <FormField label="Data">
              <input name="incurredAt" type="date" defaultValue={today} required className={INPUT_CLASS} />
            </FormField>
          </div>
          <FormField label="Valor (€)">
            <input name="amount" type="number" step="0.01" min="0.01" required className={INPUT_CLASS} />
          </FormField>
          <FormField label="Descrição (opcional)">
            <input name="description" maxLength={255} className={INPUT_CLASS}
              placeholder="Ex: Reabastecimento de gasóleo" />
          </FormField>
          <FormField label="Notas (opcional)">
            <input name="notes" maxLength={5000} className={INPUT_CLASS} />
          </FormField>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={closeAction}>Cancelar</Button>
            <Button type="submit" loading={createExpenseMut.isPending}>Registar</Button>
          </div>
        </form>
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
