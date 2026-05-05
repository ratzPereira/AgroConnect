import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyListings, getMyListingStats, markListingSold, removeListing } from '@/api/listings';
import { AnimatedPage } from '@/components/AnimatedPage';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Plus, ShoppingBag, Eye, MessageCircle, CheckCircle2,
  Trash2, ChevronLeft, ChevronRight, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ListingStatus } from '@/types/listing';

const TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'ACTIVE', label: 'Ativos' },
  { id: 'SOLD', label: 'Vendidos' },
  { id: 'DRAFT', label: 'Rascunhos' },
];

const STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  SOLD: 'Vendido',
  EXPIRED: 'Expirado',
  REMOVED: 'Removido',
};

const STATUS_BADGE_VARIANTS: Record<ListingStatus, 'default' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  SOLD: 'default',
  EXPIRED: 'warning',
  REMOVED: 'danger',
};

export function MyListings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') ?? '0');
  const activeTab = searchParams.get('status') ?? 'all';

  const [confirmSoldId, setConfirmSoldId] = useState<number | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);

  const statusFilter = activeTab === 'all' ? undefined : activeTab;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['my-listing-stats'],
    queryFn: getMyListingStats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['my-listings', page, statusFilter],
    queryFn: () => getMyListings(page, 20, statusFilter),
  });

  const listings = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const soldMut = useMutation({
    mutationFn: (id: number) => markListingSold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-listing-stats'] });
      setConfirmSoldId(null);
      toast.success('Anúncio marcado como vendido');
    },
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => removeListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-listing-stats'] });
      setConfirmRemoveId(null);
      toast.success('Anúncio removido');
    },
  });

  function handleTabChange(tab: string) {
    const newParams = new URLSearchParams();
    if (tab !== 'all') newParams.set('status', tab);
    setSearchParams(newParams, { replace: true });
  }

  function handlePageChange(newPage: number) {
    const newParams = new URLSearchParams(searchParams);
    if (newPage > 0) {
      newParams.set('page', String(newPage));
    } else {
      newParams.delete('page');
    }
    setSearchParams(newParams, { replace: true });
  }

  return (
    <AnimatedPage>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900">
          Os Meus Anúncios
        </h1>
        <Button onClick={() => navigate('/marketplace/new')} size="sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Anúncio</span>
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton.Stat key={i} />
          ))
        ) : (
          <>
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Ativos</span>
                <ShoppingBag className="h-4 w-4 text-primary-500" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">{stats?.activeCount ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Vendidos</span>
                <TrendingUp className="h-4 w-4 text-leaf-500" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">{stats?.soldCount ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Visualizações</span>
                <Eye className="h-4 w-4 text-secondary-500" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">{stats?.totalViews ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Conversas</span>
                <MessageCircle className="h-4 w-4 text-warning-500" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">{stats?.totalConversations ?? 0}</p>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={TABS}
        value={activeTab}
        onChange={handleTabChange}
      >
        {() => (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                    <Skeleton className="aspect-[16/10] w-full" />
                    <div className="p-3 space-y-2">
                      <Skeleton.Line className="h-4 w-3/4" />
                      <Skeleton.Line className="h-6 w-20" />
                      <Skeleton.Line className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <EmptyState
                illustration={<ShoppingBag className="h-16 w-16 text-neutral-300" />}
                title={
                  activeTab === 'all'
                    ? 'Sem anúncios'
                    : `Sem anúncios ${activeTab === 'ACTIVE' ? 'ativos' : activeTab === 'SOLD' ? 'vendidos' : 'em rascunho'}`
                }
                description="Comece a vender publicando o seu primeiro anúncio."
                action={
                  <Button onClick={() => navigate('/marketplace/new')}>
                    <Plus className="h-4 w-4" />
                    Novo Anúncio
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {listings.map((listing) => (
                    <div key={listing.id} className="relative group">
                      <ListingCard
                        listing={listing}
                        onClick={() => navigate(`/marketplace/${listing.id}`)}
                      />

                      {/* Status badge overlay */}
                      {listing.status !== 'ACTIVE' && (
                        <div className="absolute top-2 left-6">
                          <Badge
                            variant={STATUS_BADGE_VARIANTS[listing.status]}
                            size="sm"
                            dot
                          >
                            {STATUS_LABELS[listing.status]}
                          </Badge>
                        </div>
                      )}

                      {/* Quick actions overlay */}
                      {listing.status === 'ACTIVE' && (
                        <div className="absolute bottom-14 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmSoldId(listing.id);
                            }}
                            className="p-1.5 rounded-lg bg-white/90 border border-neutral-200 shadow-sm text-neutral-600 hover:text-primary-600 transition-colors"
                            title="Marcar como vendido"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmRemoveId(listing.id);
                            }}
                            className="p-1.5 rounded-lg bg-white/90 border border-neutral-200 shadow-sm text-neutral-600 hover:text-danger-600 transition-colors"
                            title="Remover anúncio"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-neutral-600">
                      {page + 1} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Tabs>

      {/* Confirm sold modal */}
      <Modal
        open={confirmSoldId !== null}
        onClose={() => setConfirmSoldId(null)}
        title="Marcar como Vendido"
        size="sm"
      >
        <p className="text-sm text-neutral-600 mb-6">
          Tem a certeza que pretende marcar este anúncio como vendido? Esta ação não pode ser revertida.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmSoldId(null)}>
            Cancelar
          </Button>
          <Button
            onClick={() => confirmSoldId && soldMut.mutate(confirmSoldId)}
            loading={soldMut.isPending}
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirmar Venda
          </Button>
        </div>
      </Modal>

      {/* Confirm remove modal */}
      <Modal
        open={confirmRemoveId !== null}
        onClose={() => setConfirmRemoveId(null)}
        title="Remover Anúncio"
        size="sm"
      >
        <p className="text-sm text-neutral-600 mb-6">
          Tem a certeza que pretende remover este anúncio? Esta ação não pode ser revertida.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmRemoveId(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => confirmRemoveId && removeMut.mutate(confirmRemoveId)}
            loading={removeMut.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </Button>
        </div>
      </Modal>
    </AnimatedPage>
  );
}
