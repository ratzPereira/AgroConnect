export type TransactionStatus = 'PENDING' | 'HELD' | 'RELEASED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface Transaction {
  id: number;
  requestId: number;
  proposalId: number;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  providerPayout: number;
  status: TransactionStatus;
  heldAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}
