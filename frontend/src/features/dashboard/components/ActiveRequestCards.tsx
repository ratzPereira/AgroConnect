import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { ServiceRequestSummary } from '@/types/request';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

interface ActiveRequestCardsProps {
  readonly requests: ServiceRequestSummary[];
}

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: 'Publicado',
  WITH_PROPOSALS: 'Com Propostas',
  AWARDED: 'Adjudicado',
  IN_PROGRESS: 'Em Curso',
  AWAITING_CONFIRMATION: 'Aguarda Confirmação',
  COMPLETED: 'Concluído',
  DISPUTED: 'Disputado',
};

const STATUS_VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  PUBLISHED: 'success',
  WITH_PROPOSALS: 'info',
  AWARDED: 'warning',
  IN_PROGRESS: 'info',
  AWAITING_CONFIRMATION: 'warning',
  COMPLETED: 'neutral',
  DISPUTED: 'danger',
};

export function ActiveRequestCards({ requests }: ActiveRequestCardsProps) {
  const navigate = useNavigate();

  if (requests.length === 0) {
    return (
      <button
        onClick={() => navigate('/requests/new')}
        className="w-full rounded-xl border-2 border-dashed border-neutral-300 p-6 text-center hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
      >
        <Plus className="mx-auto h-8 w-8 text-neutral-400" />
        <p className="mt-2 text-sm font-medium text-neutral-600">Crie o seu primeiro pedido</p>
      </button>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
      {requests.map((req) => (
        <button
          key={req.id}
          onClick={() => navigate(`/requests/${req.id}`)}
          className={cn(
            'flex-shrink-0 w-44 snap-start rounded-xl border border-neutral-200 bg-white p-3 text-left',
            'hover:border-primary-300 hover:shadow-sm transition-all',
          )}
        >
          <p className="text-xs text-neutral-500 truncate">{req.categoryName}</p>
          <p className="text-sm font-medium text-neutral-900 mt-1 line-clamp-2 leading-tight">
            {req.title}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <Badge variant={STATUS_VARIANTS[req.status] || 'neutral'} size="sm">
              {STATUS_LABELS[req.status] || req.status}
            </Badge>
          </div>
          <p className="text-xs text-neutral-400 mt-1.5">{req.island}</p>
        </button>
      ))}
      <button
        onClick={() => navigate('/requests/new')}
        className={cn(
          'flex-shrink-0 w-44 snap-start rounded-xl border-2 border-dashed border-neutral-300 p-3',
          'flex flex-col items-center justify-center hover:border-primary-400 transition-colors',
        )}
      >
        <Plus className="h-6 w-6 text-neutral-400" />
        <p className="text-xs text-neutral-500 mt-1">Novo Pedido</p>
      </button>
    </div>
  );
}
