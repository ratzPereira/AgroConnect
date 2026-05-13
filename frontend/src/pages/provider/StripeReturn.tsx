import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getStripeAccountStatus } from '@/api/stripe';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function StripeReturn() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['stripe-account-status', 'return'],
    queryFn: () => getStripeAccountStatus(true),
  });

  useEffect(() => {
    if (status) {
      queryClient.setQueryData(['stripe-account-status'], status);
    }
  }, [status, queryClient]);

  const isActive = status?.status === 'ACTIVE';

  return (
    <AnimatedPage className="max-w-lg mx-auto">
      <Card>
        <CardBody className="text-center py-10">
          {isLoading ? (
            <>
              <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
              <h1 className="text-lg font-semibold text-neutral-900 mb-1">A verificar configuração</h1>
              <p className="text-sm text-neutral-500">A sincronizar com a Stripe...</p>
            </>
          ) : isActive ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-leaf-600 mx-auto mb-4" />
              <h1 className="text-lg font-semibold text-neutral-900 mb-1">Configuração concluída</h1>
              <p className="text-sm text-neutral-500 mb-6">
                A sua conta Stripe está ativa. Já pode receber pagamentos pelos seus serviços.
              </p>
              <Button onClick={() => navigate('/provider/payments')}>
                Ver detalhes da conta
              </Button>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 text-warning-600 mx-auto mb-4" />
              <h1 className="text-lg font-semibold text-neutral-900 mb-1">Configuração incompleta</h1>
              <p className="text-sm text-neutral-500 mb-6">
                A Stripe ainda não validou todos os dados. Pode continuar a configuração ou
                voltar mais tarde.
              </p>
              <Button onClick={() => navigate('/provider/payments')}>
                Continuar
              </Button>
            </>
          )}
        </CardBody>
      </Card>
    </AnimatedPage>
  );
}
