import { cn } from '@/utils/cn';
import type { RequestStatus } from '@/types/request';

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Rascunho', className: 'bg-neutral-100 text-neutral-700' },
  PUBLISHED: { label: 'Publicado', className: 'bg-blue-100 text-blue-700' },
  WITH_PROPOSALS: { label: 'Com Propostas', className: 'bg-indigo-100 text-indigo-700' },
  AWARDED: { label: 'Adjudicado', className: 'bg-purple-100 text-purple-700' },
  IN_PROGRESS: { label: 'Em Curso', className: 'bg-yellow-100 text-yellow-700' },
  AWAITING_CONFIRMATION: { label: 'Aguarda Confirmação', className: 'bg-orange-100 text-orange-700' },
  COMPLETED: { label: 'Concluído', className: 'bg-green-100 text-green-700' },
  RATED: { label: 'Avaliado', className: 'bg-green-100 text-green-700' },
  DISPUTED: { label: 'Em Disputa', className: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Expirado', className: 'bg-neutral-100 text-neutral-500' },
  CANCELLED: { label: 'Cancelado', className: 'bg-neutral-100 text-neutral-500' },
};

interface RequestStatusBadgeProps {
  status: RequestStatus;
}

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
