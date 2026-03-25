import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { getMyRequests, getAvailableRequests } from '@/api/requests';
import { RequestCard } from '@/features/requests/components/RequestCard';
import { RequestFilters, type FilterState } from '@/features/requests/components/RequestFilters';
import { RequestMapView } from '@/features/requests/components/RequestMapView';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmptyRequests } from '@/components/illustrations/EmptyRequests';
import { Button } from '@/components/ui/Button';
import { useMotionConfig } from '@/hooks/useMotionConfig';
import { Plus, List, Map } from 'lucide-react';
import { cn } from '@/utils/cn';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const isClient = user?.role === 'CLIENT';
  const isProvider = user?.role?.startsWith('PROVIDER');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const { listContainerVariants, listItemVariants } = useMotionConfig();

  const view = searchParams.get('view') || 'list';
  const [filters, setFilters] = useState<FilterState>({ search: '', urgency: '', island: '' });

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: isClient
      ? ['my-requests', page, statusFilter]
      : ['available-requests', page, filters.search, filters.urgency, filters.island],
    queryFn: () =>
      isClient
        ? getMyRequests(page, 20, statusFilter || undefined)
        : getAvailableRequests({
            page,
            size: 20,
            search: filters.search || undefined,
            urgency: filters.urgency || undefined,
            island: filters.island || undefined,
          }),
  });

  function setView(v: string) {
    setSearchParams((prev) => {
      prev.set('view', v);
      return prev;
    });
  }

  return (
    <AnimatedPage>
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
        <div className="flex items-center gap-2">
          {isProvider && (
            <div className="flex rounded-lg border border-neutral-300 overflow-hidden">
              <button
                onClick={() => setView('list')}
                className={cn(
                  'px-3 py-1.5 text-sm flex items-center gap-1 transition-colors',
                  view === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50',
                )}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setView('map')}
                className={cn(
                  'px-3 py-1.5 text-sm flex items-center gap-1 transition-colors',
                  view === 'map' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50',
                )}
              >
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Mapa</span>
              </button>
            </div>
          )}
          {isClient && (
            <Button onClick={() => navigate('/requests/new')}>
              <Plus className="h-4 w-4" />
              Novo Pedido
            </Button>
          )}
        </div>
      </div>

      {isClient && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === f.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isProvider && (
        <div className="mb-4">
          <RequestFilters filters={filters} onFilterChange={handleFilterChange} />
        </div>
      )}

      {isProvider && view === 'map' ? (
        <RequestMapView filters={filters} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton.Card key={i} />
          ))}
        </div>
      ) : data && data.content.length > 0 ? (
        <>
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {data.content.map((request) => (
              <motion.div variants={listItemVariants} key={request.id}>
                <RequestCard request={request} />
              </motion.div>
            ))}
          </motion.div>
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
      ) : isClient ? (
        <EmptyState
          illustration={<EmptyRequests className="w-48 h-auto" />}
          title="Ainda sem pedidos"
          description="Crie o seu primeiro pedido de serviço e encontre o prestador ideal."
          action={
            <Button onClick={() => navigate('/requests/new')}>
              <Plus className="h-4 w-4" />
              Novo Pedido
            </Button>
          }
        />
      ) : (
        <EmptyState
          illustration={<EmptyRequests className="w-48 h-auto" />}
          title="Sem pedidos disponíveis"
          description="Não existem pedidos de serviço na sua área neste momento."
        />
      )}
    </AnimatedPage>
  );
}
