import { Card, CardBody } from '@/components/ui/Card';
import { TransactionStatusBadge } from './TransactionStatusBadge';
import { format } from 'date-fns';
import type { Transaction } from '@/types/transaction';

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
}

export function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  return (
    <Card
      className={onClick ? 'cursor-pointer hover:border-primary-200 transition-colors' : undefined}
      onClick={onClick}
    >
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <TransactionStatusBadge status={transaction.status} />
              <span className="text-xs text-neutral-500">
                Pedido #{transaction.requestId}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
              <div>
                <p className="text-neutral-500 text-xs">Valor total</p>
                <p className="font-semibold text-neutral-900">
                  {transaction.amount.toFixed(2)} &euro;
                </p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Comissão ({(transaction.commissionRate * 100).toFixed(0)}%)</p>
                <p className="font-medium text-neutral-700">
                  {transaction.commissionAmount.toFixed(2)} &euro;
                </p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Pagamento ao prestador</p>
                <p className="font-medium text-neutral-700">
                  {transaction.providerPayout.toFixed(2)} &euro;
                </p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Criado em</p>
                <p className="font-medium text-neutral-700">
                  {format(new Date(transaction.createdAt), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
