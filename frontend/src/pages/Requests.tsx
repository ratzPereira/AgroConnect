import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { getMyRequests, getAvailableRequests } from '@/api/requests';
import { RequestCard } from '@/features/requests/components/RequestCard';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmptyRequests } from '@/components/illustrations/EmptyRequests';
import { Button } from '@/components/ui/Button';
import { useMotionConfig } from '@/hooks/useMotionConfig';
import { Plus } from 'lucide-react';
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
  const { listContainerVariants, listItemVariants } = useMotionConfig();

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
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
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
