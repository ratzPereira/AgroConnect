import { apiClient } from '@/api/client';
import { getFinanceSummary } from '@/api/finance';
import { getLowStockItems } from '@/api/inventory';
import { listMachines } from '@/api/machines';
import type { ServiceRequestSummary } from '@/types/request';
import type { Notification } from '@/types/notification';
import type { FinanceSummary } from '@/api/finance';
import type { InventoryItem } from '@/types/inventory';
import type { Machine } from '@/types/machine';
import type { ActiveJob } from '@/types/pin';

export interface ClientDashboardData {
  activeRequests: number;
  totalProposals: number;
  completedRequests: number;
  totalSpent: number;
  recentRequests: ServiceRequestSummary[];
  recentNotifications: Notification[];
}

export interface ProviderDashboardData {
  finance: FinanceSummary;
  lowStockItems: InventoryItem[];
  maintenanceDueMachines: Machine[];
}

export async function getClientDashboardStats(): Promise<ClientDashboardData> {
  const { data } = await apiClient.get<ClientDashboardData>('/dashboard/client');
  return data;
}

export async function getProviderActiveJobs(): Promise<ActiveJob[]> {
  const { data } = await apiClient.get<ActiveJob[]>('/providers/me/finance/active-jobs');
  return data;
}

export async function getProviderDashboardStats(): Promise<ProviderDashboardData> {
  const [finance, lowStockItems, allMachines] = await Promise.all([
    getFinanceSummary(),
    getLowStockItems(),
    listMachines(),
  ]);

  const today = new Date();
  const maintenanceDueMachines = allMachines.filter((m) => {
    if (!m.nextMaintenanceDate) return false;
    return new Date(m.nextMaintenanceDate) <= today;
  });

  return { finance, lowStockItems, maintenanceDueMachines };
}
