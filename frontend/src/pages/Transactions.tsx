import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getMyTransactions } from '@/api/transactions';
import { TransactionCard } from '@/features/transactions/components/TransactionCard';
import { TransactionDetailModal } from '@/features/transactions/components/TransactionDetailModal';
import { AnimatedPage } from '@/components/AnimatedPage';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmptyTransactions } from '@/components/illustrations/EmptyTransactions';
import { Button } from '@/components/ui/Button';
import { useMotionConfig } from '@/hooks/useMotionConfig';
import type { Transaction } from '@/types/transaction';

export function Transactions() {
  const [page, setPage] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const { listContainerVariants, listItemVariants } = useMotionConfig();

  const { data, isLoading } = useQuery({
    queryKey: ['my-transactions', page],
    queryFn: () => getMyTransactions(page, 20),
  });

  return (
    <AnimatedPage>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold font-display leading-tight text-neutral-900">
          Transações
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Histórico de pagamentos e movimentos financeiros
        </p>
      </div>

      {isLoading ? (
        <Skeleton.Table />
      ) : data && data.content.length > 0 ? (
        <>
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {data.content.map((transaction) => (
              <motion.div variants={listItemVariants} key={transaction.id}>
                <TransactionCard transaction={transaction} onClick={() => setSelectedTx(transaction)} />
              </motion.div>
            ))}
          </motion.div>
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
        <EmptyState
          illustration={<EmptyTransactions className="w-48 h-auto" />}
          title="Nenhuma transação ainda"
          description="As suas transações aparecerão aqui assim que concluir o seu primeiro serviço."
        />
      )}

      <TransactionDetailModal
        transaction={selectedTx}
        open={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
      />
    </AnimatedPage>
  );
}
