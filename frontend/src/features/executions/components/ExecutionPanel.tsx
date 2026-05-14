import { useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExecutionByRequest, completeExecution } from '@/api/executions';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AssignmentForm } from './AssignmentForm';
import { CheckinButton } from './CheckinButton';
import { ExecutionPhotoUpload } from './ExecutionPhotoUpload';
import { DistanceIndicator } from './DistanceIndicator';
import { CheckinMap } from './CheckinMap';
import { JobCostingPanel } from './JobCostingPanel';
import { Loader2, Users, MapPinCheck, Camera, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import type { RequestStatus } from '@/types/request';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message || fallback;
  }
  return fallback;
}

interface ExecutionPanelProps {
  readonly requestId: number;
  readonly requestStatus: RequestStatus;
  readonly isProvider: boolean;
  readonly targetLat?: number;
  readonly targetLon?: number;
}

/**
 * Wrapper: renders nothing unless the request is in execution-eligible status.
 * This avoids hook-count changes — the inner component is only mounted when needed.
 */
export function ExecutionPanel({ requestId, requestStatus, isProvider, targetLat, targetLon }: ExecutionPanelProps) {
  const showExecution =
    requestStatus === 'AWARDED' ||
    requestStatus === 'IN_PROGRESS' ||
    requestStatus === 'AWAITING_CONFIRMATION' ||
    requestStatus === 'COMPLETED' ||
    requestStatus === 'RATED' ||
    requestStatus === 'DISPUTED';

  if (!showExecution) return null;

  return (
    <ExecutionPanelContent
      requestId={requestId}
      requestStatus={requestStatus}
      isProvider={isProvider}
      targetLat={targetLat}
      targetLon={targetLon}
    />
  );
}

function ExecutionPanelContent({ requestId, requestStatus, isProvider, targetLat, targetLon }: ExecutionPanelProps) {
  const queryClient = useQueryClient();
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeMaterials, setCompleteMaterials] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  const { data: execution, isLoading } = useQuery({
    queryKey: ['execution', requestId],
    queryFn: () => getExecutionByRequest(requestId),
  });

  const completeMutation = useMutation({
    mutationFn: () => {
      if (!execution) throw new Error('No execution');
      return completeExecution(execution.id, {
        notes: completeNotes || undefined,
        materialsUsed: completeMaterials || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['client-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      setShowCompleteForm(false);
    },
  });

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

  if (!execution) {
    return null;
  }

  const checkinDate = execution.checkinTime ? new Date(execution.checkinTime) : null;
  const isCheckedIn = checkinDate !== null && !Number.isNaN(checkinDate.getTime());
  const isCompleted = Boolean(execution.completedAt);

  return (
    <>
    <Card className="mb-6">
      <CardHeader>
        <h2 className="font-semibold text-neutral-900 text-sm">Execução do Serviço</h2>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* Progress steps */}
        <div className="flex items-center gap-2">
          <StepIndicator
            label="Equipa"
            icon={<Users className="h-3.5 w-3.5" />}
            active={execution.assignments.length > 0}
          />
          <div className="flex-1 h-px bg-neutral-200" />
          <StepIndicator
            label="Check-in"
            icon={<MapPinCheck className="h-3.5 w-3.5" />}
            active={isCheckedIn}
          />
          <div className="flex-1 h-px bg-neutral-200" />
          <StepIndicator
            label="Fotos"
            icon={<Camera className="h-3.5 w-3.5" />}
            active={execution.photos.length > 0}
          />
          <div className="flex-1 h-px bg-neutral-200" />
          <StepIndicator
            label="Concluído"
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            active={isCompleted}
          />
        </div>

        {/* Assignments */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Equipa Atribuída
          </h3>
          {execution.assignments.length > 0 ? (
            <div className="space-y-2">
              {execution.assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-sm bg-neutral-50 rounded-lg px-3 py-2"
                >
                  <div>
                    <span className="font-medium text-neutral-900">{a.teamMemberName}</span>
                    <span className="text-neutral-500 ml-2">({a.teamMemberRole})</span>
                  </div>
                  {a.machineName && (
                    <span className="text-xs text-neutral-500">{a.machineName}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Nenhum membro atribuído.</p>
          )}
          {isProvider && requestStatus === 'AWARDED' && (
            <div className="mt-3">
              <AssignmentForm executionId={execution.id} requestId={requestId} />
            </div>
          )}
        </div>

        {/* Check-in */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Check-in
          </h3>
          {targetLat != null && targetLon != null && (
            <div className="mb-3">
              <CheckinMap
                targetLat={targetLat}
                targetLon={targetLon}
                checkedIn={isCheckedIn}
                checkinLat={execution.checkinLatitude ?? undefined}
                checkinLon={execution.checkinLongitude ?? undefined}
              />
            </div>
          )}
          {isCheckedIn && (
            <div className="text-sm text-neutral-700 bg-green-50 rounded-lg px-3 py-2">
              <p>
                Check-in realizado em{' '}
                <span className="font-medium">
                  {checkinDate ? format(checkinDate, 'dd/MM/yyyy HH:mm') : '—'}
                </span>
              </p>
              {execution.checkinLatitude !== null && execution.checkinLongitude !== null && (
                <p className="text-xs text-neutral-500 mt-1">
                  Coordenadas: {execution.checkinLatitude.toFixed(4)},{' '}
                  {execution.checkinLongitude.toFixed(4)}
                </p>
              )}
            </div>
          )}
          {!isCheckedIn && isProvider && (requestStatus === 'AWARDED' || requestStatus === 'IN_PROGRESS') && (
            <div className="space-y-2">
              {targetLat != null && targetLon != null && (
                <DistanceIndicator targetLat={targetLat} targetLon={targetLon} />
              )}
              <CheckinButton executionId={execution.id} requestId={requestId} />
            </div>
          )}
          {!isCheckedIn && !(isProvider && (requestStatus === 'AWARDED' || requestStatus === 'IN_PROGRESS')) && (
            <p className="text-sm text-neutral-500">Check-in ainda não realizado.</p>
          )}
        </div>

        {/* Photos */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Fotos da Execução
          </h3>
          {execution.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {execution.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.photoUrl}
                  alt="Foto da execução"
                  className="w-full h-24 object-cover rounded-lg border border-neutral-200"
                />
              ))}
            </div>
          )}
          {isProvider && !isCompleted && isCheckedIn && (
            <ExecutionPhotoUpload executionId={execution.id} requestId={requestId} />
          )}
          {!isProvider && execution.photos.length === 0 && (
            <p className="text-sm text-neutral-500">Nenhuma foto carregada.</p>
          )}
        </div>

        {/* Complete button (provider, after check-in, not yet completed) */}
        {isProvider && isCheckedIn && !isCompleted && (
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Concluir Serviço
            </h3>
            {showCompleteForm ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="completeNotes" className="block text-sm font-medium text-neutral-700">
                    Notas (opcional)
                  </label>
                  <textarea
                    id="completeNotes"
                    rows={2}
                    value={completeNotes}
                    onChange={(e) => setCompleteNotes(e.target.value)}
                    placeholder="Observações sobre o trabalho realizado..."
                    className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="completeMaterials" className="block text-sm font-medium text-neutral-700">
                    Materiais utilizados (opcional)
                  </label>
                  <input
                    id="completeMaterials"
                    type="text"
                    value={completeMaterials}
                    onChange={(e) => setCompleteMaterials(e.target.value)}
                    placeholder="Ex: Herbicida 5L, Adubo 20kg"
                    className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => completeMutation.mutate()}
                    loading={completeMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar Conclusão
                  </Button>
                  <Button variant="outline" onClick={() => setShowCompleteForm(false)}>
                    Cancelar
                  </Button>
                </div>
                {completeMutation.isError && (
                  <p className="text-sm text-red-600">
                    {getErrorMessage(completeMutation.error, 'Erro ao concluir. Tente novamente.')}
                  </p>
                )}
              </div>
            ) : (
              <Button onClick={() => setShowCompleteForm(true)}>
                <CheckCircle2 className="h-4 w-4" />
                Marcar como Concluído
              </Button>
            )}
          </div>
        )}

        {/* Notes */}
        {isCompleted && (execution.notes || execution.materialsUsed) && (
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Notas de Conclusão
            </h3>
            {execution.notes && (
              <p className="text-sm text-neutral-700 mb-1">{execution.notes}</p>
            )}
            {execution.materialsUsed && (() => {
              let items: { product: string; quantity: number; unit: string }[] = [];
              try { items = JSON.parse(execution.materialsUsed); } catch { /* not JSON */ }
              if (!Array.isArray(items) || items.length === 0) {
                return (
                  <p className="text-sm text-neutral-500">
                    <span className="font-medium">Materiais:</span> {execution.materialsUsed}
                  </p>
                );
              }
              return (
                <div>
                  <span className="text-sm font-medium text-neutral-500">Materiais:</span>
                  <ul className="mt-1 space-y-1">
                    {items.map((m, i) => (
                      <li key={`mat-${m.product}-${i}`} className="text-sm text-neutral-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 flex-shrink-0" />
                        {m.product} — {m.quantity} {m.unit}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
        )}
      </CardBody>
    </Card>
    {isProvider && (
      <JobCostingPanel
        executionId={execution.id}
        requestId={requestId}
        isProvider={isProvider}
        canEdit={isProvider}
      />
    )}
    </>
  );
}

function StepIndicator({
  label,
  icon,
  active,
}: {
  readonly label: string;
  readonly icon: ReactNode;
  readonly active: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-400',
        )}
      >
        {icon}
      </div>
      <span
        className={cn(
          'text-[10px] font-medium',
          active ? 'text-green-700' : 'text-neutral-400',
        )}
      >
        {label}
      </span>
    </div>
  );
}
