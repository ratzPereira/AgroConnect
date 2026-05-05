import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale/pt';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import type { ServiceRequestSummary, RequestStatus } from '@/types/request';

interface RecentRequestsProps {
  requests: ServiceRequestSummary[];
  className?: string;
}

const statusLabel: Record<string, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  WITH_PROPOSALS: 'Com propostas',
  AWARDED: 'Adjudicado',
  IN_PROGRESS: 'Em progresso',
  AWAITING_CONFIRMATION: 'Aguarda confirmação',
  COMPLETED: 'Concluído',
  RATED: 'Avaliado',
  DISPUTED: 'Em disputa',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

const statusBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  PUBLISHED: 'info',
  WITH_PROPOSALS: 'info',
  AWARDED: 'default',
  IN_PROGRESS: 'default',
  AWAITING_CONFIRMATION: 'warning',
  COMPLETED: 'success',
  RATED: 'success',
  DISPUTED: 'danger',
  EXPIRED: 'neutral',
  CANCELLED: 'neutral',
  DRAFT: 'neutral',
};

function getBadgeVariant(status: RequestStatus) {
  return statusBadgeVariant[status] ?? 'neutral';
}

export function RecentRequests({ requests, className }: RecentRequestsProps) {
  if (requests.length === 0) return null;

  return (
    <div className={cn(className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-800">Pedidos recentes</h3>
        <Link to="/requests" className="text-xs text-secondary-600 hover:underline">
          Ver todos
        </Link>
      </div>
      <div className="space-y-2">
        {requests.slice(0, 5).map((req) => (
          <Link
            key={req.id}
            to={`/requests/${req.id}`}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 hover:shadow-card transition-all duration-150"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-800 truncate">{req.title}</p>
              <p className="text-xs text-neutral-500">
                {req.categoryName} · {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: pt })}
              </p>
            </div>
            <Badge variant={getBadgeVariant(req.status)} size="sm">
              {statusLabel[req.status] ?? req.status}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
