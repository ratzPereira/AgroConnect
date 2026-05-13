import { useEffect, useMemo, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { ProposalAcceptResponse } from '@/types/stripe';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  acceptance: ProposalAcceptResponse | null;
  onSucceeded: () => void;
}

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

function getStripePromise(publishableKey: string): Promise<Stripe | null> {
  let cached = stripePromiseCache.get(publishableKey);
  if (!cached) {
    cached = loadStripe(publishableKey);
    stripePromiseCache.set(publishableKey, cached);
  }
  return cached;
}

export function PaymentModal({ open, onClose, acceptance, onSucceeded }: PaymentModalProps) {
  const stripePromise = useMemo(() => {
    if (!acceptance) return null;
    return getStripePromise(acceptance.publishableKey);
  }, [acceptance]);

  if (!acceptance || !stripePromise) {
    return null;
  }

  return (
    <Modal open={open} onClose={onClose} title="Confirmar pagamento" size="md">
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: acceptance.clientSecret,
          locale: 'pt',
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#16a34a',
              colorText: '#171717',
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              borderRadius: '8px',
            },
          },
        }}
      >
        <PaymentForm acceptance={acceptance} onSucceeded={onSucceeded} onClose={onClose} />
      </Elements>
    </Modal>
  );
}

interface PaymentFormProps {
  acceptance: ProposalAcceptResponse;
  onSucceeded: () => void;
  onClose: () => void;
}

function PaymentForm({ acceptance, onSucceeded, onClose }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  useEffect(() => {
    if (succeeded) {
      const timer = setTimeout(() => onSucceeded(), 1500);
      return () => clearTimeout(timer);
    }
  }, [succeeded, onSucceeded]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message ?? 'Não foi possível processar o pagamento.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      setSucceeded(true);
    } else {
      setErrorMessage('O pagamento não foi confirmado. Tente novamente.');
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="h-12 w-12 text-leaf-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">Pagamento confirmado</h3>
        <p className="text-sm text-neutral-500">
          A proposta foi aceite. O valor fica retido até o trabalho ser concluído.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start gap-3 p-3 bg-primary-50 border border-primary-100 rounded-lg">
        <ShieldCheck className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-primary-900">
          <p className="font-medium">Pagamento seguro</p>
          <p className="text-primary-800">
            O valor fica retido pela AgroConnect até confirmar a conclusão do serviço. Se algo
            correr mal, é reembolsado.
          </p>
        </div>
      </div>

      <div className="flex items-baseline justify-between border-b border-neutral-200 pb-3">
        <span className="text-sm text-neutral-500">Total a pagar</span>
        <span className="text-xl font-bold text-neutral-900">
          €{acceptance.amount.toFixed(2)}
        </span>
      </div>

      <PaymentElement options={{ layout: 'tabs' }} />

      {errorMessage && (
        <div className="text-sm text-danger-700 bg-danger-50 border border-danger-100 rounded-lg p-3">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting} disabled={!stripe || !elements}>
          {submitting ? 'A processar...' : `Pagar €${acceptance.amount.toFixed(2)}`}
        </Button>
      </div>

      <p className="text-[11px] text-neutral-400 text-center pt-2">
        Pagamento processado pela Stripe.{' '}
        {submitting && <Loader2 className="inline h-3 w-3 animate-spin" />}
      </p>
    </form>
  );
}
