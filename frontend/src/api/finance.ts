import { apiClient } from './client';
import type { Page } from '@/types/request';

export interface FinanceSummary {
  totalRevenue: number;
  totalCommissions: number;
  totalEarnings: number;
  pendingPayouts: number;
  thisMonthEarnings: number;
  completedJobs: number;
  avgJobValue: number;
}

export interface TransactionItem {
  id: number;
  requestId: number;
  proposalId: number;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  providerPayout: number;
  status: string;
  heldAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const response = await apiClient.get<FinanceSummary>('/providers/me/finance/summary');
  return response.data;
}

export async function getFinanceTransactions(page = 0, size = 20): Promise<Page<TransactionItem>> {
  const response = await apiClient.get<Page<TransactionItem>>('/providers/me/finance/transactions', {
    params: { page, size },
  });
  return response.data;
}
