import { Modal } from '@/components/ui/Modal';
import { TransactionStatusBadge } from './TransactionStatusBadge';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import type { Transaction } from '@/types/transaction';

interface TransactionDetailModalProps {
  readonly transaction: Transaction | null;
  readonly open: boolean;
  readonly onClose: () => void;
}

export function TransactionDetailModal({ transaction, open, onClose }: TransactionDetailModalProps) {
  if (!transaction) return null;

  return (
    <Modal open={open} onClose={onClose} title="Detalhe da transação" size="md">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Transação #{transaction.id}</p>
            <p className="text-xs text-neutral-400">Pedido #{transaction.requestId}</p>
          </div>
          <TransactionStatusBadge status={transaction.status} />
        </div>

        {/* Amounts breakdown */}
        <div className="rounded-lg border border-neutral-200 divide-y divide-neutral-100">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-neutral-600">Valor total</span>
            <span className="text-sm font-semibold text-neutral-900">{transaction.amount.toFixed(2)} &euro;</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-neutral-600">Comissão ({(transaction.commissionRate * 100).toFixed(0)}%)</span>
            <span className="text-sm text-neutral-500">-{transaction.commissionAmount.toFixed(2)} &euro;</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-leaf-50/50">
            <span className="text-sm font-medium text-leaf-700">Pagamento ao prestador</span>
            <span className="text-sm font-semibold text-leaf-700">{transaction.providerPayout.toFixed(2)} &euro;</span>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Cronologia</p>
          <div className="space-y-2">
            <TimelineEntry
              label="Criada"
              date={transaction.createdAt}
            />
            {transaction.heldAt && (
              <TimelineEntry
                label="Valor retido (escrow)"
                date={transaction.heldAt}
              />
            )}
            {transaction.releasedAt && (
              <TimelineEntry
                label="Valor libertado ao prestador"
                date={transaction.releasedAt}
              />
            )}
            {transaction.refundedAt && (
              <TimelineEntry
                label="Valor reembolsado ao cliente"
                date={transaction.refundedAt}
              />
            )}
          </div>
        </div>

        {/* Status explanation */}
        <div className="rounded-lg bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">{getStatusExplanation(transaction.status)}</p>
        </div>
      </div>
    </Modal>
  );
}

function TimelineEntry({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center gap-3">
      <ArrowRight className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
      <span className="text-sm text-neutral-700">{label}</span>
      <span className="text-xs text-neutral-400 ml-auto shrink-0">
        {format(new Date(date), 'dd/MM/yyyy HH:mm')}
      </span>
    </div>
  );
}

function getStatusExplanation(status: string): string {
  switch (status) {
    case 'HELD':
      return 'O valor está retido em escrow. Será libertado ao prestador quando o serviço for concluído e confirmado.';
    case 'RELEASED':
      return 'O pagamento foi libertado ao prestador após confirmação do serviço.';
    case 'REFUNDED':
      return 'O valor foi reembolsado ao cliente.';
    case 'PARTIALLY_REFUNDED':
      return 'Parte do valor foi reembolsado ao cliente e o restante libertado ao prestador.';
    default:
      return 'Transação em processamento.';
  }
}
