import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { listAdminListings, removeAdminListing } from '@/api/admin';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo', SOLD: 'Vendido', REMOVED: 'Removido', DRAFT: 'Rascunho', EXPIRED: 'Expirado',
};
const STATUS_CLASSES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SOLD: 'bg-blue-100 text-blue-700',
  REMOVED: 'bg-red-100 text-red-700',
  DRAFT: 'bg-neutral-100 text-neutral-700',
  EXPIRED: 'bg-amber-100 text-amber-700',
};
const CATEGORY_LABELS: Record<string, string> = {
  ANIMALS: 'Animais', PLANTS: 'Plantas e mudas', SEEDS: 'Sementes',
  PRODUCE: 'Produção', EQUIPMENT: 'Equipamento',
};

export function AdminListings() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-listings', statusFilter, page],
    queryFn: () => listAdminListings(statusFilter || undefined, page),
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => removeAdminListing(id),
    onSuccess: () => {
      toast.success('Anúncio removido.');
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Moderação de anúncios</h1>
          <p className="text-sm text-neutral-500">Reveja e remova anúncios do marketplace.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm self-start"
        >
          <option value="">Todos os estados</option>
          <option value="ACTIVE">Ativos</option>
          <option value="SOLD">Vendidos</option>
          <option value="REMOVED">Removidos</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-3 sm:px-6 py-3 font-medium">Anúncio</th>
              <th className="hidden md:table-cell px-6 py-3 font-medium">Categoria</th>
              <th className="hidden lg:table-cell px-6 py-3 font-medium">Ilha</th>
              <th className="px-3 sm:px-6 py-3 font-medium">Preço</th>
              <th className="px-3 sm:px-6 py-3 font-medium">Estado</th>
              <th className="hidden sm:table-cell px-6 py-3 font-medium">Publicado</th>
              <th className="px-3 sm:px-6 py-3"></th>
            </tr></thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin text-neutral-400 mx-auto" /></td></tr>
              ) : (data?.content?.length ?? 0) === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-neutral-500">Sem anúncios para mostrar.</td></tr>
              ) : data?.content?.map((listing) => (
                <tr key={listing.id} className="border-b border-neutral-100">
                  <td className="px-3 sm:px-6 py-3 font-medium text-neutral-900">{listing.title}</td>
                  <td className="hidden md:table-cell px-6 py-3 text-neutral-600">{CATEGORY_LABELS[listing.category] ?? listing.category}</td>
                  <td className="hidden lg:table-cell px-6 py-3 text-neutral-600">{listing.island}</td>
                  <td className="px-3 sm:px-6 py-3 text-neutral-700 tabular-nums">{listing.price !== null ? `€${listing.price.toFixed(2)}` : 'Sob consulta'}</td>
                  <td className="px-3 sm:px-6 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLASSES[listing.status] ?? 'bg-neutral-100 text-neutral-700'}`}>
                      {STATUS_LABELS[listing.status] ?? listing.status}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-3 text-neutral-500">{new Date(listing.createdAt).toLocaleDateString('pt-PT')}</td>
                  <td className="px-3 sm:px-6 py-3 text-right">
                    {listing.status !== 'REMOVED' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => removeMut.mutate(listing.id)}
                        loading={removeMut.isPending && removeMut.variables === listing.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Remover</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-neutral-100">
            <Button size="sm" variant="ghost" disabled={data.first} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <span className="text-sm text-neutral-500">Página {data.number + 1} de {data.totalPages}</span>
            <Button size="sm" variant="ghost" disabled={data.last} onClick={() => setPage((p) => p + 1)}>Seguinte</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
