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
  year: number;
  yearRevenue: number;
  yearCommissions: number;
  yearPayouts: number;
  yearMaterialsCost: number;
  yearLaborCost: number;
  yearMachineExpenses: number;
  yearNetProfit: number;
  yearMargin: number;
  yearCompletedJobs: number;
  yearAvgJobValue: number;
  yearAvgJobProfit: number;
}

export interface MonthlyBreakdownEntry {
  month: number;
  revenue: number;
  payouts: number;
  materialsCost: number;
  laborCost: number;
  machineExpenses: number;
  netProfit: number;
  completedJobs: number;
}

export interface MonthlyBreakdown {
  year: number;
  months: MonthlyBreakdownEntry[];
}

export interface YearlyComparison {
  currentYear: number;
  previousYear: number;
  currentRevenue: number;
  previousRevenue: number;
  revenueDeltaPct: number | null;
  currentProfit: number;
  previousProfit: number;
  profitDeltaPct: number | null;
  currentJobs: number;
  previousJobs: number;
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

export async function getFinanceSummary(year?: number): Promise<FinanceSummary> {
  const response = await apiClient.get<FinanceSummary>('/providers/me/finance/summary', {
    params: year ? { year } : undefined,
  });
  return response.data;
}

export async function getMonthlyBreakdown(year?: number): Promise<MonthlyBreakdown> {
  const response = await apiClient.get<MonthlyBreakdown>('/providers/me/finance/monthly-breakdown', {
    params: year ? { year } : undefined,
  });
  return response.data;
}

export async function getYearlyComparison(): Promise<YearlyComparison> {
  const response = await apiClient.get<YearlyComparison>('/providers/me/finance/yearly-comparison');
  return response.data;
}

export async function getFinanceTransactions(page = 0, size = 20): Promise<Page<TransactionItem>> {
  const response = await apiClient.get<Page<TransactionItem>>('/providers/me/finance/transactions', {
    params: { page, size },
  });
  return response.data;
}

export async function exportFinanceCsv(from: string, to: string): Promise<void> {
  const response = await apiClient.get('/providers/me/finance/export', {
    params: { from, to },
    responseType: 'blob',
  });
  const blob = new Blob([response.data as BlobPart], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transacoes_${from}_${to}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}
