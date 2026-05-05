import { apiClient } from './client';
import type { Transaction } from '@/types/transaction';
import type { Page } from '@/types/request';

export async function getMyTransactions(page = 0, size = 20): Promise<Page<Transaction>> {
  const response = await apiClient.get<Page<Transaction>>('/transactions/me', {
    params: { page, size },
  });
  return response.data;
}

export async function getTransaction(id: number): Promise<Transaction> {
  const response = await apiClient.get<Transaction>(`/transactions/${id}`);
  return response.data;
}
