import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { HandCoins, RotateCcw, Scale } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { resolveDispute } from '@/api/requests';
import { cn } from '@/utils/cn';
import type { AdminDispute, DisputeResolution } from '@/types/admin';

interface ResolveDisputeModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly dispute: AdminDispute | null;
}

const OPTIONS: ReadonlyArray<{
  value: DisputeResolution;
  title: string;
  desc: string;
  icon: typeof HandCoins;
  accent: string;
}> = [
  {
    value: 'RELEASE',
    title: 'A favor do prestador',
    desc: 'Liberta o pagamento retido em escrow para o prestador. O pedido fica Concluído.',
    icon: HandCoins,
    accent: 'primary',
  },
  {
    value: 'REFUND',
    title: 'A favor do cliente',
    desc: 'Reembolsa o cliente. O pedido fica Cancelado.',
    icon: RotateCcw,
    accent: 'danger',
  },
];

export function ResolveDisputeModal({ open, onClose, dispute }: ResolveDisputeModalProps) {
  const queryClient = useQueryClient();
  const [resolution, setResolution] = useState<DisputeResolution | null>(null);
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      if (!dispute || !resolution) throw new Error('Dados em falta');
      return resolveDispute(dispute.requestId, { resolution, notes: notes.trim() });
    },
    onSuccess: () => {
      toast.success('Disputa resolvida com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      onClose();
    },
  });

  const canSubmit = resolution !== null && notes.trim().length >= 3 && !mutation.isPending;

  return (
    <Modal open={open} onClose={onClose} title="Resolver disputa" size="lg">
      {dispute && (
        <div className="space-y-5">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-4 text-sm">
            <div className="flex items-center gap-2 mb-2 text-neutral-800 font-semibold">
              <Scale className="h-4 w-4 text-warning-600" />
              {dispute.requestTitle}
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-neutral-500">Cliente</p>
                <p className="font-medium text-neutral-800">{dispute.clientName}</p>
              </div>
              <div>
                <p className="text-neutral-500">Prestador</p>
                <p className="font-medium text-neutral-800">{dispute.providerName}</p>
              </div>
              <div>
                <p className="text-neutral-500">Valor em escrow</p>
                <p className="font-bold text-neutral-900 tabular-nums">€{dispute.amount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-700">Decisão</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = resolution === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setResolution(opt.value)}
                    aria-pressed={selected}
                    className={cn(
                      'text-left rounded-xl border-2 p-4 transition-all',
                      selected
                        ? opt.accent === 'primary'
                          ? 'border-primary-500 bg-primary-50/60'
                          : 'border-danger-500 bg-danger-50/60'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 mb-2',
                        opt.accent === 'primary' ? 'text-primary-600' : 'text-danger-600',
                      )}
                    />
                    <p className="text-sm font-semibold text-neutral-900">{opt.title}</p>
                    <p className="text-xs text-neutral-500 mt-1 leading-snug">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dispute-notes" className="text-sm font-medium text-neutral-700">
              Notas da resolução <span className="text-danger-500">*</span>
            </label>
            <textarea
              id="dispute-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Justificação da decisão (registada para auditoria)…"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant={resolution === 'REFUND' ? 'danger' : 'primary'}
              disabled={!canSubmit}
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Confirmar resolução
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
