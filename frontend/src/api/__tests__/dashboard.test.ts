import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  getClientDashboardStats,
  getProviderActiveJobs,
  getProviderDashboardStats,
} from '../dashboard';

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('../finance', () => ({
  getFinanceSummary: vi.fn(),
}));

vi.mock('../inventory', () => ({
  getLowStockItems: vi.fn(),
}));

vi.mock('../machines', () => ({
  listMachines: vi.fn(),
}));

describe('dashboard API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getClientDashboardStats calls GET /dashboard/client', async () => {
    const mockData = {
      activeRequests: 3,
      totalProposals: 5,
      completedRequests: 10,
      totalSpent: 2500,
      recentRequests: [],
      recentNotifications: [],
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getClientDashboardStats();

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/client');
    expect(result).toEqual(mockData);
  });

  it('getProviderActiveJobs calls GET /providers/me/finance/active-jobs', async () => {
    const mockData = [{ id: 1, requestId: 5 }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getProviderActiveJobs();

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/finance/active-jobs');
    expect(result).toEqual(mockData);
  });

  it('getProviderDashboardStats aggregates finance, inventory, and machines', async () => {
    const { getFinanceSummary } = await import('../finance');
    const { getLowStockItems } = await import('../inventory');
    const { listMachines } = await import('../machines');

    const financeMock = { totalRevenue: 5000, totalEarnings: 4000 };
    const lowStockMock = [{ id: 1, name: 'Fertilizante' }];
    // One machine with past maintenance date, one with future
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
    const machinesMock = [
      { id: 1, name: 'Trator', nextMaintenanceDate: pastDate },
      { id: 2, name: 'Pulverizador', nextMaintenanceDate: futureDate },
      { id: 3, name: 'Motocultivador', nextMaintenanceDate: null },
    ];

    vi.mocked(getFinanceSummary).mockResolvedValue(financeMock as never);
    vi.mocked(getLowStockItems).mockResolvedValue(lowStockMock as never);
    vi.mocked(listMachines).mockResolvedValue(machinesMock as never);

    const result = await getProviderDashboardStats();

    expect(result.finance).toEqual(financeMock);
    expect(result.lowStockItems).toEqual(lowStockMock);
    // Only the machine with past maintenance date should appear
    expect(result.maintenanceDueMachines).toHaveLength(1);
    expect(result.maintenanceDueMachines[0].id).toBe(1);
  });

  it('getProviderDashboardStats filters out machines with future maintenance dates', async () => {
    const { getFinanceSummary } = await import('../finance');
    const { getLowStockItems } = await import('../inventory');
    const { listMachines } = await import('../machines');

    const futureDate = new Date(Date.now() + 86400000 * 60).toISOString();
    const machinesMock = [
      { id: 1, name: 'Trator', nextMaintenanceDate: futureDate },
      { id: 2, name: 'Pulverizador', nextMaintenanceDate: null },
    ];

    vi.mocked(getFinanceSummary).mockResolvedValue({} as never);
    vi.mocked(getLowStockItems).mockResolvedValue([] as never);
    vi.mocked(listMachines).mockResolvedValue(machinesMock as never);

    const result = await getProviderDashboardStats();

    expect(result.maintenanceDueMachines).toHaveLength(0);
  });
});
