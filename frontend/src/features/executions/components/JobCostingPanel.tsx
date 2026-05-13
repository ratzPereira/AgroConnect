import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getJobCosts, deleteResourceUsage, updateAssignmentHours } from '@/api/jobCosting';
import { ResourceUsageModal } from './ResourceUsageModal';
import { Loader2, Plus, Trash2, AlertTriangle, Package, Clock, TrendingUp } from 'lucide-react';
import type { JobCosts, AssignmentCost } from '@/types/jobCosting';

interface JobCostingPanelProps {
  executionId: number;
  requestId: number;
  isProvider: boolean;
  canEdit: boolean;
}

const eur = (n: number) =>
  n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

const eurMore = (n: number) =>
  n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4 });

export function JobCostingPanel({ executionId, requestId, isProvider, canEdit }: JobCostingPanelProps) {
  const [usageModalOpen, setUsageModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery<JobCosts>({
    queryKey: ['job-costs', executionId],
    queryFn: () => getJobCosts(executionId),
    enabled: isProvider,
  });

  if (!isProvider) return null;

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900 text-sm">Custos & Rentabilidade</h2>
          {data.completed && (
            <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
              Bloqueado (serviço concluído)
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        {/* Resumo financeiro */}
        <FinancialSummary costs={data} />

        {/* Recursos consumidos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" /> Recursos consumidos
            </h3>
            {canEdit && !data.completed && (
              <Button size="sm" variant="ghost" onClick={() => setUsageModalOpen(true)}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            )}
          </div>
          <ResourceUsagesList
            costs={data}
            executionId={executionId}
            requestId={requestId}
            canEdit={canEdit && !data.completed}
          />
        </div>

        {/* Horas trabalhadas */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Horas trabalhadas
          </h3>
          <AssignmentsHoursList
            costs={data}
            executionId={executionId}
            requestId={requestId}
            canEdit={canEdit && !data.completed}
          />
          {data.assignmentsMissingRate > 0 && (
            <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>
                {data.assignmentsMissingRate === 1
                  ? '1 membro sem taxa horária definida — o custo de mão-de-obra está incompleto. Defina a taxa em Equipa.'
                  : `${data.assignmentsMissingRate} membros sem taxa horária definida — o custo de mão-de-obra está incompleto.`}
              </span>
            </div>
          )}
        </div>
      </CardBody>

      <ResourceUsageModal
        open={usageModalOpen}
        onClose={() => setUsageModalOpen(false)}
        executionId={executionId}
        requestId={requestId}
      />
    </Card>
  );
}

function FinancialSummary({ costs }: { costs: JobCosts }) {
  const isProfit = costs.netProfit >= 0;
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <SummaryTile label="Receita" value={eur(costs.revenue)} tone="neutral" />
        <SummaryTile label="Materiais" value={`− ${eur(costs.materialsCost)}`} tone="neutral" />
        <SummaryTile label="Mão-de-obra" value={`− ${eur(costs.laborCost)}`} tone="neutral" />
        <SummaryTile
          label={`Comissão (${(Number(costs.commissionRate) * 100).toFixed(0)}%)`}
          value={`− ${eur(costs.commission)}`}
          tone="neutral"
        />
      </div>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className={`h-4 w-4 ${isProfit ? 'text-green-600' : 'text-red-600'}`} />
          <span className="text-sm font-medium text-neutral-700">Lucro líquido</span>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
            {eur(costs.netProfit)}
          </p>
          {costs.revenue > 0 && (
            <p className="text-[11px] text-neutral-500">
              margem {Number(costs.marginPercent).toFixed(1)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone: 'neutral' }) {
  return (
    <div className="rounded-lg bg-white border border-neutral-200 px-3 py-2">
      <p className="text-[11px] text-neutral-500">{label}</p>
      <p className={`text-sm font-semibold ${tone === 'neutral' ? 'text-neutral-800' : ''}`}>{value}</p>
    </div>
  );
}

function ResourceUsagesList({
  costs,
  executionId,
  requestId,
  canEdit,
}: {
  costs: JobCosts;
  executionId: number;
  requestId: number;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();

  const deleteMut = useMutation({
    mutationFn: (usageId: number) => deleteResourceUsage(executionId, usageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-costs', executionId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['execution', requestId] });
    },
  });

  if (costs.resourceUsages.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhum recurso consumido neste serviço.</p>;
  }

  return (
    <div className="space-y-1.5">
      {costs.resourceUsages.map((u) => (
        <div
          key={u.id}
          className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <p className="font-medium text-neutral-900 truncate">{u.productName}</p>
            <p className="text-xs text-neutral-500">
              {u.quantity} {u.unit.toLowerCase()} × {eurMore(u.unitCostSnapshot)}
              {u.notes && <span className="ml-1">· {u.notes}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-semibold text-neutral-900">{eur(u.totalCost)}</span>
            {canEdit && (
              <button
                onClick={() => {
                  if (confirm('Reverter este consumo? O stock será reposto.')) deleteMut.mutate(u.id);
                }}
                disabled={deleteMut.isPending}
                aria-label="Remover consumo"
                className="text-neutral-400 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AssignmentsHoursList({
  costs,
  executionId,
  requestId,
  canEdit,
}: {
  costs: JobCosts;
  executionId: number;
  requestId: number;
  canEdit: boolean;
}) {
  if (costs.assignments.length === 0) {
    return <p className="text-sm text-neutral-500">Sem membros atribuídos.</p>;
  }
  return (
    <div className="space-y-2">
      {costs.assignments.map((a) => (
        <AssignmentHoursRow
          key={a.assignmentId}
          assignment={a}
          executionId={executionId}
          requestId={requestId}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}

function AssignmentHoursRow({
  assignment,
  executionId,
  requestId,
  canEdit,
}: {
  assignment: AssignmentCost;
  executionId: number;
  requestId: number;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [hoursWorked, setHoursWorked] = useState(String(assignment.hoursWorked));
  const [machineHours, setMachineHours] = useState(String(assignment.machineHours));
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      updateAssignmentHours(executionId, assignment.assignmentId, {
        hoursWorked: Number(hoursWorked),
        machineHours: Number(machineHours),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-costs', executionId] });
      queryClient.invalidateQueries({ queryKey: ['execution', requestId] });
      setEditing(false);
      setError(null);
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Erro ao guardar horas.');
      } else {
        setError('Erro ao guardar horas.');
      }
    },
  });

  return (
    <div className="bg-neutral-50 rounded-lg px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-neutral-900 truncate">{assignment.teamMemberName}</p>
          <p className="text-xs text-neutral-500">
            {assignment.hoursWorked}h trabalhadas
            {Number(assignment.machineHours) > 0 && ` · ${assignment.machineHours}h máquina`}
            {' · '}
            {assignment.effectiveHourlyRate != null
              ? `${Number(assignment.effectiveHourlyRate).toFixed(2)} €/h`
              : <span className="text-amber-700">sem taxa</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-semibold text-neutral-900">{eur(assignment.laborCost)}</span>
          {canEdit && !editing && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Editar
            </Button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label htmlFor={`hw-${assignment.assignmentId}`} className="block text-[11px] text-neutral-600 mb-1">
              Horas trabalhadas
            </label>
            <input
              id={`hw-${assignment.assignmentId}`}
              type="number"
              min="0"
              step="0.01"
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor={`mh-${assignment.assignmentId}`} className="block text-[11px] text-neutral-600 mb-1">
              Horas de máquina
            </label>
            <input
              id={`mh-${assignment.assignmentId}`}
              type="number"
              min="0"
              step="0.01"
              value={machineHours}
              onChange={(e) => setMachineHours(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 sm:col-span-2">{error}</p>
          )}
          <div className="flex gap-2 sm:col-span-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setError(null); }}>
              Cancelar
            </Button>
            <Button size="sm" onClick={() => mut.mutate()} loading={mut.isPending}>
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
