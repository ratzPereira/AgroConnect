import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInventoryItem,
  listMovements,
  recordPurchase,
  recordAdjustmentIn,
  recordAdjustmentOut,
  deleteInventoryItem,
  updateInventoryItem,
} from '@/api/inventory';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { AnimatedPage } from '@/components/AnimatedPage';
import { PriceHistory } from '@/features/inventory/components/PriceHistory';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Pencil,
  AlertTriangle,
} from 'lucide-react';
import type {
  InventoryUnit,
  MovementType,
  RecordPurchaseRequest,
  RecordAdjustmentInRequest,
  RecordAdjustmentOutRequest,
} from '@/types/inventory';

const unitLabels: Record<InventoryUnit, string> = { KG: 'kg', L: 'L', UNIT: 'un' };

const movementLabels: Record<MovementType, string> = {
  INITIAL: 'Stock inicial',
  PURCHASE: 'Compra',
  CONSUMPTION: 'Consumo',
  ADJUSTMENT_IN: 'Ajuste +',
  ADJUSTMENT_OUT: 'Ajuste −',
};

const movementBadgeStyles: Record<MovementType, string> = {
  INITIAL: 'bg-neutral-100 text-neutral-700',
  PURCHASE: 'bg-leaf-100 text-leaf-700',
  CONSUMPTION: 'bg-clay-100 text-clay-700',
  ADJUSTMENT_IN: 'bg-blue-100 text-blue-700',
  ADJUSTMENT_OUT: 'bg-warning-100 text-warning-700',
};

type ActionKind = 'purchase' | 'adjustment-in' | 'adjustment-out' | 'rename' | 'delete' | null;

export function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const itemId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<ActionKind>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ['inventory', itemId],
    queryFn: () => getInventoryItem(itemId),
    enabled: Number.isFinite(itemId),
  });

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['inventory', itemId, 'movements', page],
    queryFn: () => listMovements(itemId, page, 10),
    enabled: Number.isFinite(itemId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory', itemId] });
    queryClient.invalidateQueries({ queryKey: ['inventory', itemId, 'price-history'] });
    queryClient.invalidateQueries({ queryKey: ['low-stock'] });
  };

  const handleError = (e: unknown) => {
    const err = e as { response?: { data?: { message?: string } } };
    setError(err?.response?.data?.message ?? 'Não foi possível concluir a operação.');
  };

  const purchaseMut = useMutation({
    mutationFn: (data: RecordPurchaseRequest) => recordPurchase(itemId, data),
    onSuccess: () => { invalidate(); setAction(null); setError(null); },
    onError: handleError,
  });

  const adjInMut = useMutation({
    mutationFn: (data: RecordAdjustmentInRequest) => recordAdjustmentIn(itemId, data),
    onSuccess: () => { invalidate(); setAction(null); setError(null); },
    onError: handleError,
  });

  const adjOutMut = useMutation({
    mutationFn: (data: RecordAdjustmentOutRequest) => recordAdjustmentOut(itemId, data),
    onSuccess: () => { invalidate(); setAction(null); setError(null); },
    onError: handleError,
  });

  const renameMut = useMutation({
    mutationFn: (data: { productName?: string; minStockAlert?: number | null }) =>
      updateInventoryItem(itemId, data),
    onSuccess: () => { invalidate(); setAction(null); setError(null); },
    onError: handleError,
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteInventoryItem(itemId),
    onSuccess: () => { invalidate(); navigate('/provider/inventory'); },
    onError: handleError,
  });

  if (itemLoading || !item) {
    return (
      <AnimatedPage>
        <Skeleton.Card />
      </AnimatedPage>
    );
  }

  const closeAction = () => { setAction(null); setError(null); };

  return (
    <AnimatedPage>
      <button
        onClick={() => navigate('/provider/inventory')}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao inventário
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{item.productName}</h1>
          <p className="text-sm text-neutral-500">Unidade: {unitLabels[item.unit]}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setAction('rename')}>
            <Pencil className="h-4 w-4" />Editar
          </Button>
          <Button size="sm" variant="danger" onClick={() => setAction('delete')}>
            <Trash2 className="h-4 w-4" />Eliminar
          </Button>
        </div>
      </div>

      {item.lowStock && (
        <Alert variant="warning" title="Stock baixo" className="mb-6">
          A quantidade atual está abaixo do alerta mínimo.
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Stock atual" value={`${item.quantity} ${unitLabels[item.unit]}`} />
        <StatCard
          label="Custo médio"
          value={item.costPerUnit == null ? '—' : `€${item.costPerUnit}`}
          hint="Preço médio ponderado"
        />
        <StatCard
          label="Alerta mínimo"
          value={item.minStockAlert == null ? '—' : `${item.minStockAlert} ${unitLabels[item.unit]}`}
        />
        <StatCard
          label="Valor em stock"
          value={
            item.costPerUnit == null
              ? '—'
              : `€${(item.quantity * item.costPerUnit).toFixed(2)}`
          }
        />
      </div>

      <Card className="mb-6"><CardBody>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setAction('purchase')}>
            <ShoppingCart className="h-4 w-4" />Registar compra
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAction('adjustment-in')}>
            <Plus className="h-4 w-4" />Adicionar stock
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAction('adjustment-out')}>
            <Minus className="h-4 w-4" />Retirar stock
          </Button>
        </div>
      </CardBody></Card>

      <div className="mb-6">
        <PriceHistory itemId={itemId} unit={item.unit} currentWac={item.costPerUnit} />
      </div>

      <h2 className="text-sm font-semibold text-neutral-700 mb-3">Histórico de movimentos</h2>
      {movementsLoading && <Skeleton.Table />}
      {!movementsLoading && movements && movements.content.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-3 sm:px-6 py-3 font-medium">Tipo</th>
                <th className="px-3 sm:px-6 py-3 font-medium">Variação</th>
                <th className="hidden sm:table-cell px-6 py-3 font-medium">Stock após</th>
                <th className="hidden md:table-cell px-6 py-3 font-medium">WAC após</th>
                <th className="hidden md:table-cell px-6 py-3 font-medium">Razão</th>
                <th className="hidden lg:table-cell px-6 py-3 font-medium">Autor</th>
                <th className="px-3 sm:px-6 py-3 font-medium">Data</th>
              </tr></thead>
              <tbody>
                {movements.content.map((m) => (
                  <tr key={m.id} className="border-b border-neutral-100">
                    <td className="px-3 sm:px-6 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${movementBadgeStyles[m.movementType]}`}>
                        {movementLabels[m.movementType]}
                      </span>
                    </td>
                    <td className={`px-3 sm:px-6 py-3 font-medium ${m.quantityDelta >= 0 ? 'text-leaf-700' : 'text-warning-700'}`}>
                      {m.quantityDelta >= 0 ? '+' : ''}{m.quantityDelta} {unitLabels[item.unit]}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-3 text-neutral-600">{m.quantityAfter}</td>
                    <td className="hidden md:table-cell px-6 py-3 text-neutral-600">€{m.wacAfter}</td>
                    <td className="hidden md:table-cell px-6 py-3 text-neutral-600">{m.reason ?? '—'}</td>
                    <td className="hidden lg:table-cell px-6 py-3 text-neutral-600">{m.actorName ?? '—'}</td>
                    <td className="px-3 sm:px-6 py-3 text-neutral-500 text-xs">
                      {new Date(m.createdAt).toLocaleString('pt-PT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {movements.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
              <span className="text-xs text-neutral-500">
                Página {movements.number + 1} de {movements.totalPages} ({movements.totalElements} movimentos)
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" disabled={movements.first} onClick={() => setPage((p) => Math.max(0, p - 1))}>Anterior</Button>
                <Button size="sm" variant="ghost" disabled={movements.last} onClick={() => setPage((p) => p + 1)}>Seguinte</Button>
              </div>
            </div>
          )}
        </Card>
      )}
      {!movementsLoading && (!movements || movements.content.length === 0) && (
        <Card><CardBody>
          <p className="text-sm text-neutral-500 text-center py-8">Sem movimentos registados.</p>
        </CardBody></Card>
      )}

      {/* Purchase modal */}
      <Modal open={action === 'purchase'} onClose={closeAction} title="Registar compra">
        <form
          className="p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            purchaseMut.mutate({
              quantity: Number(fd.get('quantity')),
              unitCost: Number(fd.get('unitCost')),
              reason: (fd.get('reason') as string) || undefined,
            });
          }}
        >
          {error && <Alert variant="danger">{error}</Alert>}
          <FormField label={`Quantidade (${unitLabels[item.unit]})`}>
            <input name="quantity" type="number" step="0.001" min="0.001" required className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full" />
          </FormField>
          <FormField label="Custo unitário pago (€)">
            <input name="unitCost" type="number" step="0.0001" min="0" required className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full" />
          </FormField>
          <FormField label="Nota (opcional)">
            <input name="reason" maxLength={255} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full" placeholder="Ex: Fornecedor Repsol" />
          </FormField>
          <p className="text-xs text-neutral-500">O custo médio será recalculado com base nas quantidades.</p>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={closeAction}>Cancelar</Button>
            <Button type="submit" loading={purchaseMut.isPending}>Registar compra</Button>
          </div>
        </form>
      </Modal>

      {/* Adjustment IN modal */}
      <Modal open={action === 'adjustment-in'} onClose={closeAction} title="Adicionar stock (ajuste)">
        <form
          className="p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const unitCostStr = fd.get('unitCost') as string;
            adjInMut.mutate({
              quantity: Number(fd.get('quantity')),
              unitCost: unitCostStr ? Number(unitCostStr) : undefined,
              reason: fd.get('reason') as string,
            });
          }}
        >
          {error && <Alert variant="danger">{error}</Alert>}
          <FormField label={`Quantidade a adicionar (${unitLabels[item.unit]})`}>
            <input name="quantity" type="number" step="0.001" min="0.001" required className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full" />
          </FormField>
          <FormField label="Custo unitário (€, opcional)">
            <input name="unitCost" type="number" step="0.0001" min="0" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full" />
          </FormField>
          <FormField label="Razão">
            <input name="reason" required maxLength={255} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full" placeholder="Ex: Stock encontrado em armazém" />
          </FormField>
          <p className="text-xs text-neutral-500">Sem custo unitário, o custo médio mantém-se. Com custo, é recalculado.</p>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={closeAction}>Cancelar</Button>
            <Button type="submit" loading={adjInMut.isPending}>Adicionar</Button>
          </div>
        </form>
      </Modal>

      {/* Adjustment OUT modal */}
      <Modal open={action === 'adjustment-out'} onClose={closeAction} title="Retirar stock (ajuste)">
        <form
          className="p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            adjOutMut.mutate({
              quantity: Number(fd.get('quantity')),
              reason: fd.get('reason') as string,
            });
          }}
        >
          {error && <Alert variant="danger">{error}</Alert>}
          <FormField label={`Quantidade a retirar (${unitLabels[item.unit]})`}>
            <input name="quantity" type="number" step="0.001" min="0.001" max={item.quantity} required className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full" />
          </FormField>
          <FormField label="Razão">
            <input name="reason" required maxLength={255} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full" placeholder="Ex: Estragado / quebra" />
          </FormField>
          <p className="text-xs text-neutral-500">O custo médio é preservado.</p>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={closeAction}>Cancelar</Button>
            <Button type="submit" variant="danger" loading={adjOutMut.isPending}>Retirar</Button>
          </div>
        </form>
      </Modal>

      {/* Rename modal */}
      <Modal open={action === 'rename'} onClose={closeAction} title="Editar item">
        <form
          className="p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const nameRaw = (fd.get('productName') as string).trim();
            const alertRaw = (fd.get('minStockAlert') as string).trim();
            renameMut.mutate({
              productName: nameRaw && nameRaw !== item.productName ? nameRaw : undefined,
              minStockAlert: alertRaw === '' ? null : Number(alertRaw),
            });
          }}
        >
          {error && <Alert variant="danger">{error}</Alert>}
          <FormField label="Nome do produto">
            <input name="productName" defaultValue={item.productName} required maxLength={120} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full" />
          </FormField>
          <FormField label={`Alerta mínimo de stock (${unitLabels[item.unit]}, vazio para remover)`}>
            <input name="minStockAlert" type="number" step="0.001" min="0" defaultValue={item.minStockAlert ?? ''} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full" />
          </FormField>
          <p className="text-xs text-neutral-500">A quantidade e o custo são geridos pelos movimentos.</p>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={closeAction}>Cancelar</Button>
            <Button type="submit" loading={renameMut.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={action === 'delete'} onClose={closeAction} title="Eliminar item">
        <div className="p-6 space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="flex items-start gap-3 text-sm text-neutral-700">
            <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-neutral-900">Eliminar &quot;{item.productName}&quot;?</p>
              <p className="text-neutral-500 mt-1">
                O item deixa de aparecer no inventário. O histórico de movimentos é preservado para auditoria.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={closeAction}>Cancelar</Button>
            <Button type="button" variant="danger" loading={deleteMut.isPending} onClick={() => deleteMut.mutate()}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </AnimatedPage>
  );
}

function StatCard({ label, value, hint }: { readonly label: string; readonly value: string; readonly hint?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs text-neutral-500 mb-1">{label}</p>
        <p className="text-lg font-semibold text-neutral-900">{value}</p>
        {hint && <p className="text-xs text-neutral-400 mt-1">{hint}</p>}
      </CardBody>
    </Card>
  );
}

function FormField({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-neutral-700">{label}</label>
      {children}
    </div>
  );
}
