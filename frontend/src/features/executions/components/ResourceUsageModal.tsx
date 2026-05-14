import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { listInventory } from '@/api/inventory';
import { recordResourceUsage } from '@/api/jobCosting';
import type { InventoryItem } from '@/types/inventory';
import { Loader2 } from 'lucide-react';

interface ResourceUsageModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly executionId: number;
  readonly requestId: number;
}

const unitLabels: Record<InventoryItem['unit'], string> = { KG: 'kg', L: 'L', UNIT: 'un' };

export function ResourceUsageModal({ open, onClose, executionId, requestId }: ResourceUsageModalProps) {
  const queryClient = useQueryClient();
  const [itemId, setItemId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: listInventory,
    enabled: open,
  });

  const selectedItem = useMemo(
    () => items?.find((i) => i.id === itemId) ?? null,
    [items, itemId],
  );

  const mutation = useMutation({
    mutationFn: () => {
      if (typeof itemId !== 'number') throw new Error('Seleccione um item.');
      return recordResourceUsage(executionId, {
        inventoryItemId: itemId,
        quantity: Number(quantity),
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-costs', executionId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['execution', requestId] });
      reset();
      onClose();
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message;
        if (status === 409) {
          setError(message || 'Stock insuficiente para esta quantidade.');
          return;
        }
        if (status === 400) {
          setError(message || 'Dados inválidos.');
          return;
        }
      }
      setError('Erro ao registar consumo. Tente novamente.');
    },
  });

  function reset() {
    setItemId('');
    setQuantity('');
    setNotes('');
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const qty = Number(quantity);
    if (typeof itemId !== 'number') {
      setError('Seleccione um produto do inventário.');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Quantidade tem de ser maior que zero.');
      return;
    }
    if (selectedItem && qty > selectedItem.quantity) {
      setError(`Stock insuficiente. Disponível: ${selectedItem.quantity} ${unitLabels[selectedItem.unit]}.`);
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Registar consumo de recurso" size="md">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="ru-item" className="block text-sm font-medium text-neutral-700 mb-1">
            Produto
          </label>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" /> A carregar inventário…
            </div>
          )}
          {!isLoading && items && items.length > 0 && (
            <select
              id="ru-item"
              value={itemId}
              onChange={(e) => setItemId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">— Seleccionar —</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.productName} ({i.quantity} {unitLabels[i.unit]} em stock
                  {i.costPerUnit != null ? ` · ${i.costPerUnit.toFixed(4)} €/${unitLabels[i.unit]}` : ''})
                </option>
              ))}
            </select>
          )}
          {!isLoading && (!items || items.length === 0) && (
            <p className="text-sm text-neutral-500">
              Sem itens no inventário. Adicione produtos antes de registar consumo.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="ru-qty" className="block text-sm font-medium text-neutral-700 mb-1">
            Quantidade {selectedItem && <span className="text-neutral-500">({unitLabels[selectedItem.unit]})</span>}
          </label>
          <input
            id="ru-qty"
            type="number"
            min="0"
            step="0.001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.000"
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {selectedItem && (
            <p className="text-[11px] text-neutral-500 mt-1">
              Stock disponível: {selectedItem.quantity} {unitLabels[selectedItem.unit]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="ru-notes" className="block text-sm font-medium text-neutral-700 mb-1">
            Observações (opcional)
          </label>
          <input
            id="ru-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Aplicado no talhão A"
            maxLength={255}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending} disabled={!items || items.length === 0}>
            Registar consumo
          </Button>
        </div>
      </form>
    </Modal>
  );
}
