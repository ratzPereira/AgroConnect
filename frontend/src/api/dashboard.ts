import { getMyRequests } from '@/api/requests';
import { getMyNotifications } from '@/api/notifications';
import { getFinanceSummary } from '@/api/finance';
import { getLowStockItems } from '@/api/inventory';
import { listMachines } from '@/api/machines';
import type { ServiceRequestSummary } from '@/types/request';
import type { Notification } from '@/types/notification';
import type { FinanceSummary } from '@/api/finance';
import type { InventoryItem } from '@/types/inventory';
import type { Machine } from '@/types/machine';

const TERMINAL_STATUSES = new Set(['RATED', 'EXPIRED', 'CANCELLED']);

export interface ClientDashboardData {
  activeRequests: ServiceRequestSummary[];
  totalRequests: number;
  completedCount: number;
  recentNotifications: Notification[];
}

export interface ProviderDashboardData {
  finance: FinanceSummary;
  lowStockItems: InventoryItem[];
  maintenanceDueMachines: Machine[];
}

export async function getClientDashboardStats(): Promise<ClientDashboardData> {
  const [requestsPage, completedPage, notifPage] = await Promise.all([
    getMyRequests(0, 100),
    getMyRequests(0, 1, 'COMPLETED'),
    getMyNotifications(0, 8),
  ]);

  const activeRequests = requestsPage.content.filter(
    (r) => !TERMINAL_STATUSES.has(r.status),
  );

  return {
    activeRequests,
    totalRequests: requestsPage.totalElements,
    completedCount: completedPage.totalElements,
    recentNotifications: notifPage.content,
  };
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
