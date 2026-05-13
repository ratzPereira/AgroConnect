import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listInventory, getLowStockItems, createInventoryItem } from '@/api/inventory';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmptyTransactions } from '@/components/illustrations/EmptyTransactions';
import { Alert } from '@/components/ui/Alert';
import { Plus, ChevronRight } from 'lucide-react';
import type { InventoryUnit, CreateInventoryItemRequest } from '@/types/inventory';

const unitLabels: Record<InventoryUnit, string> = { KG: 'kg', L: 'L', UNIT: 'un' };

export function Inventory() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: listInventory,
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: getLowStockItems,
  });

  const createMut = useMutation({
    mutationFn: (data: CreateInventoryItemRequest) => createInventoryItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      setShowForm(false);
    },
  });

  return (
    <AnimatedPage>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Inventário</h1>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Adicionar</Button>
      </div>

      {lowStock && lowStock.length > 0 && (
        <Alert variant="warning" title="Stock baixo" className="mb-6">
          {lowStock.length} {lowStock.length === 1 ? 'item com' : 'itens com'} stock baixo
        </Alert>
      )}

      {showForm && (
        <Card className="mb-6"><CardBody>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            createMut.mutate({
              productName: fd.get('productName') as string,
              unit: fd.get('unit') as InventoryUnit,
              quantity: Number(fd.get('quantity')),
              minStockAlert: fd.get('minStockAlert') ? Number(fd.get('minStockAlert')) : undefined,
              costPerUnit: fd.get('costPerUnit') ? Number(fd.get('costPerUnit')) : undefined,
            });
          }} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input name="productName" placeholder="Nome do produto" required className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
              <select name="unit" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                <option value="KG">Kg</option><option value="L">Litros</option><option value="UNIT">Unidades</option>
              </select>
              <input name="quantity" type="number" step="0.001" min="0" placeholder="Quantidade inicial" required className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="minStockAlert" type="number" step="0.001" placeholder="Alerta mín. stock" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
              <input name="costPerUnit" type="number" step="0.0001" placeholder="Custo inicial/unidade (€)" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            </div>
            <p className="text-xs text-neutral-500">
              A quantidade inicial fica registada como movimento INITIAL no histórico. Para ajustar stock depois, use os movimentos.
            </p>
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={createMut.isPending}>Guardar</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </CardBody></Card>
      )}

      {isLoading ? (
        <Skeleton.Table />
      ) : items && items.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-3 sm:px-6 py-3 font-medium">Produto</th>
                <th className="hidden sm:table-cell px-6 py-3 font-medium">Unidade</th>
                <th className="px-3 sm:px-6 py-3 font-medium">Qtd.</th>
                <th className="hidden md:table-cell px-6 py-3 font-medium">Alerta</th>
                <th className="hidden md:table-cell px-6 py-3 font-medium">Custo/un</th>
                <th className="px-3 sm:px-6 py-3 font-medium">Estado</th>
                <th className="px-3 sm:px-6 py-3"></th>
              </tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/provider/inventory/${item.id}`)}
                  >
                    <td className="px-3 sm:px-6 py-3 font-medium text-neutral-900">{item.productName}</td>
                    <td className="hidden sm:table-cell px-6 py-3 text-neutral-600">{unitLabels[item.unit]}</td>
                    <td className="px-3 sm:px-6 py-3 text-neutral-600">{item.quantity}</td>
                    <td className="hidden md:table-cell px-6 py-3 text-neutral-600">{item.minStockAlert ?? '—'}</td>
                    <td className="hidden md:table-cell px-6 py-3 text-neutral-600">{item.costPerUnit != null ? `€${item.costPerUnit}` : '—'}</td>
                    <td className="px-3 sm:px-6 py-3">{item.lowStock
                      ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-warning-100 text-warning-700">Baixo</span>
                      : <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-leaf-100 text-leaf-700">OK</span>}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-neutral-400">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          illustration={<EmptyTransactions className="w-48 h-auto" />}
          title="Inventário vazio"
          description="Adicione itens ao seu inventário para controlar stock e custos."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />Adicionar item
            </Button>
          }
        />
      )}
    </AnimatedPage>
  );
}
