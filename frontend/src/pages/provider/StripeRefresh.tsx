import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { startStripeOnboarding } from '@/api/stripe';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function StripeRefresh() {
  const navigate = useNavigate();

  const refreshLink = useMutation({
    mutationFn: () => startStripeOnboarding(),
    onSuccess: (response) => {
      window.location.href = response.onboardingUrl;
    },
    onError: () => {
      toast.error('Não foi possível gerar um novo link. Tente novamente.');
    },
  });

  useEffect(() => {
    refreshLink.mutate();
    // intentionally only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatedPage className="max-w-lg mx-auto">
      <Card>
        <CardBody className="text-center py-10">
          {refreshLink.isPending && (
            <>
              <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
              <h1 className="text-lg font-semibold text-neutral-900 mb-1">A gerar novo link</h1>
              <p className="text-sm text-neutral-500">Será redirecionado para a Stripe...</p>
            </>
          )}
          {refreshLink.isError && (
            <>
              <AlertCircle className="h-12 w-12 text-danger-600 mx-auto mb-4" />
              <h1 className="text-lg font-semibold text-neutral-900 mb-1">Erro ao gerar link</h1>
              <p className="text-sm text-neutral-500 mb-6">
                Não foi possível gerar um novo link de configuração.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => refreshLink.mutate()}>Tentar novamente</Button>
                <Button variant="outline" onClick={() => navigate('/provider/payments')}>
                  Voltar
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </AnimatedPage>
  );
}
