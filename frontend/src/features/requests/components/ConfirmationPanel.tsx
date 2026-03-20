import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmRequest, disputeRequest } from '@/api/requests';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface ConfirmationPanelProps {
  requestId: number;
}

export function ConfirmationPanel({ requestId }: ConfirmationPanelProps) {
  const queryClient = useQueryClient();
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeError, setDisputeError] = useState<string | null>(null);

  const confirmMutation = useMutation({
    mutationFn: () => confirmRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
    },
  });

  const disputeMutation = useMutation({
    mutationFn: (reason: string) => disputeRequest(requestId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      setShowDisputeForm(false);
    },
  });

  function handleDispute() {
    if (disputeReason.trim().length < 10) {
      setDisputeError('O motivo deve ter pelo menos 10 caracteres.');
      return;
    }
    setDisputeError(null);
    disputeMutation.mutate(disputeReason.trim());
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="font-semibold text-neutral-900 text-sm">Confirmação do Serviço</h2>
      </CardHeader>
      <CardBody>
        <p className="text-sm text-neutral-600 mb-4">
          O prestador marcou o serviço como concluído. Verifique o trabalho realizado e confirme ou
          abra uma disputa.
        </p>

        {!showDisputeForm ? (
          <div className="flex gap-3">
            <Button
              onClick={() => confirmMutation.mutate()}
              loading={confirmMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirmar Conclusão
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDisputeForm(true)}
            >
              <AlertTriangle className="h-4 w-4" />
              Abrir Disputa
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="disputeReason" className="block text-sm font-medium text-neutral-700">
                Motivo da disputa
              </label>
              <textarea
                id="disputeReason"
                rows={3}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Descreva o motivo pelo qual não aceita a conclusão do serviço..."
                className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              />
              {disputeError && <p className="text-xs text-red-600">{disputeError}</p>}
            </div>
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleDispute}
                loading={disputeMutation.isPending}
              >
                Submeter Disputa
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisputeForm(false);
                  setDisputeReason('');
                  setDisputeError(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {confirmMutation.isError && (
          <p className="text-sm text-red-600 mt-3">
            Erro ao confirmar. Tente novamente.
          </p>
        )}
        {disputeMutation.isError && (
          <p className="text-sm text-red-600 mt-3">
            Erro ao abrir disputa. Tente novamente.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
