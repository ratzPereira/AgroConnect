import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { getStripeAccountStatus, startStripeOnboarding } from '@/api/stripe';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { StripeAccountStatus } from '@/types/stripe';

const STATUS_LABEL: Record<StripeAccountStatus, string> = {
  NOT_CONNECTED: 'Não configurado',
  PENDING: 'Em verificação',
  ACTIVE: 'Ativo',
};

const STATUS_VARIANT: Record<StripeAccountStatus, 'neutral' | 'warning' | 'success'> = {
  NOT_CONNECTED: 'neutral',
  PENDING: 'warning',
  ACTIVE: 'success',
};

export function StripePayments() {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['stripe-account-status'],
    queryFn: () => getStripeAccountStatus(false),
  });

  const onboardMutation = useMutation({
    mutationFn: () => startStripeOnboarding(),
    onSuccess: (response) => {
      // Stripe AccountLinks are short-lived — full-page redirect, no new tab
      globalThis.location.href = response.onboardingUrl;
    },
    onError: () => {
      toast.error('Não foi possível iniciar o processo. Tente novamente.');
    },
  });

  const refreshStatus = useMutation({
    mutationFn: () => getStripeAccountStatus(true),
    onSuccess: (data) => {
      queryClient.setQueryData(['stripe-account-status'], data);
      toast.success('Estado atualizado.');
    },
  });

  if (isLoading) {
    return (
      <AnimatedPage>
        <h1 className="text-xl font-bold text-neutral-900 mb-6">Pagamentos</h1>
        <Skeleton.Rect className="h-64" />
      </AnimatedPage>
    );
  }

  const isActive = status?.status === 'ACTIVE';
  const isPending = status?.status === 'PENDING';
  const isNotConnected = status?.status === 'NOT_CONNECTED';

  return (
    <AnimatedPage>
      <h1 className="text-xl font-bold text-neutral-900 mb-2">Pagamentos</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Configure a sua conta Stripe Connect para receber pagamentos dos clientes.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900 text-sm">Conta Stripe</h2>
            {status && (
              <Badge variant={STATUS_VARIANT[status.status]} dot>
                {STATUS_LABEL[status.status]}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {isNotConnected && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-primary-50 border border-primary-100 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-primary-900">
                  <p className="font-medium mb-1">Configure a sua conta para começar a receber</p>
                  <p className="text-primary-800">
                    Será redirecionado para o Stripe para preencher os seus dados (NIF, IBAN,
                    morada). Os pagamentos ficam retidos até o trabalho ser concluído.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => onboardMutation.mutate()}
                loading={onboardMutation.isPending}
              >
                <ExternalLink className="h-4 w-4" />
                Configurar conta Stripe
              </Button>
            </div>
          )}

          {isPending && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-warning-50 border border-warning-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-warning-900">
                  <p className="font-medium mb-1">Configuração incompleta</p>
                  <p className="text-warning-800">
                    A sua conta foi criada, mas ainda há dados em falta. Continue a configuração
                    para começar a receber pagamentos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CapabilityRow label="Dados submetidos" enabled={status?.detailsSubmitted ?? false} />
                <CapabilityRow label="Pode receber pagamentos" enabled={status?.chargesEnabled ?? false} />
                <CapabilityRow label="Pode fazer levantamentos" enabled={status?.payoutsEnabled ?? false} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => onboardMutation.mutate()}
                  loading={onboardMutation.isPending}
                >
                  <ExternalLink className="h-4 w-4" />
                  Continuar configuração
                </Button>
                <Button
                  variant="outline"
                  onClick={() => refreshStatus.mutate()}
                  loading={refreshStatus.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                  Verificar estado
                </Button>
              </div>
            </div>
          )}

          {isActive && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-leaf-50 border border-leaf-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-leaf-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-leaf-900">
                  <p className="font-medium mb-1">Conta configurada com sucesso</p>
                  <p className="text-leaf-800">
                    Já pode receber pagamentos pelos seus serviços. A AgroConnect retém 12% de
                    comissão de cada transação concluída.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CapabilityRow label="Dados submetidos" enabled={status.detailsSubmitted} />
                <CapabilityRow label="Pode receber pagamentos" enabled={status.chargesEnabled} />
                <CapabilityRow label="Pode fazer levantamentos" enabled={status.payoutsEnabled} />
              </div>

              {status.accountId && (
                <p className="text-xs text-neutral-400 font-mono">ID: {status.accountId}</p>
              )}

              <Button
                variant="outline"
                onClick={() => onboardMutation.mutate()}
                loading={onboardMutation.isPending}
              >
                <ExternalLink className="h-4 w-4" />
                Atualizar dados na Stripe
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-neutral-900 text-sm">Como funciona</h2>
        </CardHeader>
        <CardBody>
          <ol className="space-y-3 text-sm text-neutral-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">1</span>
              <span>O cliente paga o valor da proposta no momento da aceitação.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">2</span>
              <span>O dinheiro fica retido na AgroConnect (escrow) até o trabalho ser concluído.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">3</span>
              <span>Após o cliente confirmar a conclusão, o pagamento (88% do total) é transferido automaticamente para a sua conta Stripe.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">4</span>
              <span>O Stripe envia o valor para a sua conta bancária no prazo habitual (1-2 dias úteis).</span>
            </li>
          </ol>
        </CardBody>
      </Card>
    </AnimatedPage>
  );
}

function CapabilityRow({ label, enabled }: { readonly label: string; readonly enabled: boolean }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 bg-white">
      {enabled ? (
        <CheckCircle2 className="h-4 w-4 text-leaf-600 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 text-neutral-400 flex-shrink-0" />
      )}
      <span className={enabled ? 'text-sm text-neutral-700' : 'text-sm text-neutral-500'}>
        {label}
      </span>
    </div>
  );
}
