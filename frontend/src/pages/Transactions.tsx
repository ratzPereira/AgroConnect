import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyTransactions } from '@/api/transactions';
import { TransactionCard } from '@/features/transactions/components/TransactionCard';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

export function Transactions() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['my-transactions', page],
    queryFn: () => getMyTransactions(page, 20),
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900">
          Transações
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Histórico de pagamentos e movimentos financeiros
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : data && data.content.length > 0 ? (
        <>
          <div className="space-y-3">
            {data.content.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </div>
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
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-neutral-500">Ainda não tem transações.</p>
        </div>
      )}
    </div>
  );
}
