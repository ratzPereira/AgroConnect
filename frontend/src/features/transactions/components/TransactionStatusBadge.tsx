import { cn } from '@/utils/cn';
import type { TransactionStatus } from '@/types/transaction';

const statusConfig: Record<TransactionStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendente', className: 'bg-neutral-100 text-neutral-600' },
  HELD: { label: 'Retido', className: 'bg-yellow-100 text-yellow-700' },
  RELEASED: { label: 'Libertado', className: 'bg-green-100 text-green-700' },
  REFUNDED: { label: 'Reembolsado', className: 'bg-red-100 text-red-700' },
  PARTIALLY_REFUNDED: { label: 'Parcialmente Reembolsado', className: 'bg-orange-100 text-orange-700' },
};

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
}

export function TransactionStatusBadge({ status }: TransactionStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
