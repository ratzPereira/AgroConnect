import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { getMyRequests, getAvailableRequests } from '@/api/requests';
import { RequestCard } from '@/features/requests/components/RequestCard';
import { Button } from '@/components/ui/Button';
import { Plus, Loader2 } from 'lucide-react';
import type { RequestStatus } from '@/types/request';

const STATUS_FILTERS: { label: string; value: RequestStatus | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Rascunho', value: 'DRAFT' },
  { label: 'Publicado', value: 'PUBLISHED' },
  { label: 'Com Propostas', value: 'WITH_PROPOSALS' },
  { label: 'Adjudicado', value: 'AWARDED' },
  { label: 'Em Curso', value: 'IN_PROGRESS' },
  { label: 'Concluído', value: 'COMPLETED' },
];

export function Requests() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isClient = user?.role === 'CLIENT';
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: isClient
      ? ['my-requests', page, statusFilter]
      : ['available-requests', page],
    queryFn: () =>
      isClient
        ? getMyRequests(page, 20, statusFilter || undefined)
        : getAvailableRequests(page, 20),
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900">
            {isClient ? 'Meus Pedidos' : 'Pedidos Disponíveis'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isClient
              ? 'Gerir os seus pedidos de serviço'
              : 'Pedidos de serviço na sua área'}
          </p>
        </div>
        {isClient && (
          <Button onClick={() => navigate('/requests/new')}>
            <Plus className="h-4 w-4" />
            Novo Pedido
          </Button>
        )}
      </div>

      {isClient && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === f.value
                  ? 'bg-green-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : data && data.content.length > 0 ? (
        <>
          <div className="space-y-3">
            {data.content.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={data.first}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="inline-flex items-center text-sm text-neutral-500">
                {data.number + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Seguinte
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-neutral-500">
            {isClient
              ? 'Ainda não tem pedidos. Crie o seu primeiro pedido de serviço.'
              : 'Não existem pedidos disponíveis na sua área.'}
          </p>
          {isClient && (
            <Button className="mt-4" onClick={() => navigate('/requests/new')}>
              <Plus className="h-4 w-4" />
              Criar Pedido
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
