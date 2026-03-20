import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listInventory, getLowStockItems, createInventoryItem, deleteInventoryItem } from '@/api/inventory';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { InventoryUnit, CreateInventoryItemRequest } from '@/types/inventory';

const unitLabels: Record<InventoryUnit, string> = { KG: 'kg', L: 'L', UNIT: 'un' };

export function Inventory() {
  const queryClient = useQueryClient();
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); queryClient.invalidateQueries({ queryKey: ['low-stock'] }); setShowForm(false); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteInventoryItem(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); queryClient.invalidateQueries({ queryKey: ['low-stock'] }); },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Inventário</h1>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Adicionar</Button>
      </div>

      {lowStock && lowStock.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{lowStock.length} {lowStock.length === 1 ? 'item com' : 'itens com'} stock baixo</span>
        </div>
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
            <div className="grid grid-cols-3 gap-3">
              <input name="productName" placeholder="Nome do produto" required className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
              <select name="unit" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                <option value="KG">Kg</option><option value="L">Litros</option><option value="UNIT">Unidades</option>
              </select>
              <input name="quantity" type="number" step="0.01" min="0" placeholder="Quantidade" required className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input name="minStockAlert" type="number" step="0.01" placeholder="Alerta mín. stock" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
              <input name="costPerUnit" type="number" step="0.01" placeholder="Custo/unidade (€)" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={createMut.isPending}>Guardar</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </CardBody></Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-6 py-3 font-medium">Produto</th>
              <th className="px-6 py-3 font-medium">Unidade</th>
              <th className="px-6 py-3 font-medium">Quantidade</th>
              <th className="px-6 py-3 font-medium">Alerta</th>
              <th className="px-6 py-3 font-medium">Custo/un</th>
              <th className="px-6 py-3 font-medium">Estado</th>
              <th className="px-6 py-3"></th>
            </tr></thead>
            <tbody>
              {items?.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100">
                  <td className="px-6 py-3 font-medium text-neutral-900">{item.productName}</td>
                  <td className="px-6 py-3 text-neutral-600">{unitLabels[item.unit]}</td>
                  <td className="px-6 py-3 text-neutral-600">{item.quantity}</td>
                  <td className="px-6 py-3 text-neutral-600">{item.minStockAlert ?? '—'}</td>
                  <td className="px-6 py-3 text-neutral-600">{item.costPerUnit != null ? `€${item.costPerUnit}` : '—'}</td>
                  <td className="px-6 py-3">{item.lowStock
                    ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Baixo</span>
                    : <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">OK</span>}
                  </td>
                  <td className="px-6 py-3">
                    <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items?.length === 0 && <div className="px-6 py-6 text-center text-sm text-neutral-500">Nenhum item de inventário.</div>}
      </Card>
    </div>
  );
}
