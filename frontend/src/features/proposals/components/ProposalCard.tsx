import { Card, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { Star } from 'lucide-react';
import type { ProposalResponse } from '@/types/proposal';

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
  ACCEPTED: { label: 'Aceite', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejeitada', className: 'bg-red-100 text-red-700' },
  WITHDRAWN: { label: 'Retirada', className: 'bg-neutral-100 text-neutral-500' },
};

const pricingLabels: Record<string, string> = {
  FIXED: 'Preço fixo',
  PER_UNIT: 'Por unidade',
  RECURRING: 'Recorrente',
};

interface ProposalCardProps {
  proposal: ProposalResponse;
  isRequestOwner?: boolean;
  onAccept?: (id: number) => void;
  acceptLoading?: boolean;
}

export function ProposalCard({ proposal, isRequestOwner, onAccept, acceptLoading }: ProposalCardProps) {
  const config = statusConfig[proposal.status];

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-neutral-900">{proposal.providerName}</span>
              {proposal.providerReviews > 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs text-neutral-500">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {proposal.providerRating.toFixed(1)} ({proposal.providerReviews})
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-600 mt-1">{proposal.description}</p>
            {proposal.includesText && (
              <p className="text-xs text-neutral-500 mt-2">
                <span className="font-medium text-green-700">Inclui:</span> {proposal.includesText}
              </p>
            )}
            {proposal.excludesText && (
              <p className="text-xs text-neutral-500 mt-1">
                <span className="font-medium text-red-700">Exclui:</span> {proposal.excludesText}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-neutral-900">{proposal.price.toFixed(2)} &euro;</p>
            <p className="text-xs text-neutral-500">{pricingLabels[proposal.pricingModel] ?? proposal.pricingModel}</p>
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1', config.className)}>
              {config.label}
            </span>
          </div>
        </div>
      </CardBody>
      {isRequestOwner && proposal.status === 'PENDING' && onAccept && (
        <CardFooter className="flex justify-end">
          <Button
            size="sm"
            loading={acceptLoading}
            onClick={() => onAccept(proposal.id)}
          >
            Aceitar proposta
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
