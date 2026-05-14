import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Clock,
  MapPin,
  User,
  Wrench,
  Tag,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Repeat,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CalendarEvent } from '@/types/calendar';
import { listTeamMembers } from '@/api/teamMembers';
import { completeExecution } from '@/api/executions';
import { useReassignExecution } from '../../hooks/useCalendar';
import { cn } from '@/utils/cn';

interface EventPopoverProps {
  readonly event: CalendarEvent;
  readonly anchor: { x: number; y: number };
  readonly onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  AWARDED: 'Adjudicado',
  IN_PROGRESS: 'Em execução',
  AWAITING_CONFIRMATION: 'A aguardar confirmação',
  COMPLETED: 'Concluído',
  RATED: 'Avaliado',
  CANCELLED: 'Cancelado',
  DISPUTED: 'Em disputa',
};

const STATUS_TONE: Record<string, string> = {
  AWARDED: 'bg-secondary-100 text-secondary-800',
  IN_PROGRESS: 'bg-primary-100 text-primary-800',
  AWAITING_CONFIRMATION: 'bg-warning-100 text-warning-800',
  COMPLETED: 'bg-leaf-100 text-leaf-800',
  RATED: 'bg-leaf-200 text-leaf-900',
  CANCELLED: 'bg-neutral-200 text-neutral-700',
  DISPUTED: 'bg-danger-100 text-danger-800',
};

const URGENCY_LABEL: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

export function EventPopover({ event, anchor, onClose }: EventPopoverProps) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const [mode, setMode] = useState<'idle' | 'complete' | 'reassign'>('idle');
  const [notes, setNotes] = useState('');
  const [materials, setMaterials] = useState('');
  const [targetOperatorId, setTargetOperatorId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const teamQuery = useQuery({
    queryKey: ['team-members'],
    queryFn: listTeamMembers,
    enabled: mode === 'reassign',
    staleTime: 5 * 60 * 1000,
  });

  const completeMut = useMutation({
    mutationFn: () =>
      completeExecution(event.executionId, {
        notes: notes.trim() || undefined,
        materialsUsed: materials.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Trabalho marcado como concluído');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-summary'] });
      onClose();
    },
    onError: () => toast.error('Erro ao concluir o trabalho'),
  });

  const reassign = useReassignExecution();
  const currentOperatorId = event.assignments[0]?.teamMemberId ?? null;

  async function handleReassign() {
    if (!targetOperatorId || !currentOperatorId) return;
    try {
      await reassign.mutateAsync({
        executionId: event.executionId,
        data: { fromTeamMemberId: currentOperatorId, toTeamMemberId: targetOperatorId },
      });
      onClose();
    } catch {
      // toast handled by hook
    }
  }

  const canComplete =
    event.status === 'IN_PROGRESS' || event.status === 'AWAITING_CONFIRMATION';
  const canReassign = currentOperatorId != null && event.status !== 'COMPLETED' && event.status !== 'RATED';

  const time = event.scheduledAllDay
    ? 'Dia inteiro'
    : `${event.scheduledStartTime ?? '?'}–${event.scheduledEndTime ?? '?'}`;
  const dateRange =
    event.scheduledDate === event.scheduledEndDate
      ? event.scheduledDate
      : `${event.scheduledDate} → ${event.scheduledEndDate}`;

  const left = Math.min(Math.max(anchor.x, 12), window.innerWidth - 360);
  const top = Math.min(Math.max(anchor.y, 12), window.innerHeight - 380);

  return (
    <dialog
      ref={ref}
      open
      className="fixed z-50 m-0 w-[340px] rounded-xl border border-neutral-200 bg-white shadow-xl p-0"
      style={{ left, top }}
      aria-label={`Detalhes: ${event.requestTitle}`}
    >
      <header className="flex items-start justify-between border-b border-neutral-100 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-neutral-900">{event.requestTitle}</h3>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                STATUS_TONE[event.status] ?? 'bg-neutral-100 text-neutral-700',
              )}
            >
              {STATUS_LABEL[event.status] ?? event.status}
            </span>
            {event.urgency === 'HIGH' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-danger-100 px-2 py-0.5 text-[10px] font-medium text-danger-800">
                <AlertTriangle className="h-3 w-3" /> {URGENCY_LABEL[event.urgency]}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="space-y-2 px-4 py-3 text-xs text-neutral-700">
        <Row icon={<Clock className="h-3.5 w-3.5" />} label="Horário">
          {dateRange} · {time}
        </Row>
        <Row icon={<MapPin className="h-3.5 w-3.5" />} label="Local">
          {event.parish}, {event.island}
        </Row>
        <Row icon={<Tag className="h-3.5 w-3.5" />} label="Categoria">
          {event.categoryName}
        </Row>
        {event.assignments.length > 0 ? (
          <div className="space-y-1">
            {event.assignments.map((a) => (
              <div key={`${a.teamMemberId}-${a.machineId ?? 'noM'}`} className="flex items-center gap-2 rounded-md bg-neutral-50 px-2 py-1.5">
                <User className="h-3.5 w-3.5 text-neutral-500" />
                <span className="font-medium text-neutral-800">{a.teamMemberName}</span>
                {a.machineName && (
                  <>
                    <Wrench className="ml-2 h-3.5 w-3.5 text-neutral-500" />
                    <span>{a.machineName}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-warning-50 px-2 py-1.5 text-warning-800">
            Sem operador atribuído
          </p>
        )}
      </div>

      {mode === 'complete' && (
        <div className="space-y-2 border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 text-xs">
          <label className="block">
            <span className="mb-1 block font-medium text-neutral-700">Notas</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-xs"
              placeholder="Observações finais (opcional)"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium text-neutral-700">Materiais usados</span>
            <input
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-xs"
              placeholder="Ex.: 30L herbicida, 2 sacos sementes"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMode('idle')}
              className="rounded-md px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => completeMut.mutate()}
              disabled={completeMut.isPending}
              className="rounded-md bg-leaf-600 px-2.5 py-1.5 font-medium text-white hover:bg-leaf-700 disabled:opacity-50"
            >
              {completeMut.isPending ? 'A concluir…' : 'Confirmar conclusão'}
            </button>
          </div>
        </div>
      )}

      {mode === 'reassign' && (
        <div className="space-y-2 border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 text-xs">
          <label className="block">
            <span className="mb-1 block font-medium text-neutral-700">Novo operador</span>
            <select
              value={targetOperatorId ?? ''}
              onChange={(e) => setTargetOperatorId(Number(e.target.value) || null)}
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-xs"
            >
              <option value="">Selecione…</option>
              {teamQuery.data
                ?.filter((m) => m.id !== currentOperatorId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.role}
                  </option>
                ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMode('idle')}
              className="rounded-md px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleReassign}
              disabled={!targetOperatorId || reassign.isPending}
              className="rounded-md bg-primary-600 px-2.5 py-1.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {reassign.isPending ? 'A reatribuir…' : 'Reatribuir'}
            </button>
          </div>
        </div>
      )}

      {mode === 'idle' && (
        <footer className="flex items-center justify-between gap-2 border-t border-neutral-100 px-4 py-2.5">
          <Link
            to={`/provider/requests/${event.requestId}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Ver detalhes
          </Link>
          <div className="flex items-center gap-1.5">
            {canReassign && (
              <button
                type="button"
                onClick={() => setMode('reassign')}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Repeat className="h-3.5 w-3.5" /> Reatribuir
              </button>
            )}
            {canComplete && (
              <button
                type="button"
                onClick={() => setMode('complete')}
                className="inline-flex items-center gap-1 rounded-md bg-leaf-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-leaf-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
              </button>
            )}
          </div>
        </footer>
      )}
    </dialog>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-500">{icon}</span>
      <span className="w-20 text-neutral-500">{label}</span>
      <span className="flex-1 truncate text-neutral-800">{children}</span>
    </div>
  );
}
