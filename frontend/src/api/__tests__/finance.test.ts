import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  getFinanceSummary,
  getFinanceTransactions,
  getMonthlyBreakdown,
  getYearlyComparison,
  exportFinanceCsv,
} from '../finance';

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('finance API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getFinanceSummary calls GET /providers/me/finance/summary without params when no year', async () => {
    const mockData = {
      totalRevenue: 5000,
      totalCommissions: 500,
      totalEarnings: 4500,
      pendingPayouts: 200,
      thisMonthEarnings: 1000,
      completedJobs: 15,
      avgJobValue: 333,
      year: 2026,
      yearRevenue: 2000,
      yearCommissions: 200,
      yearPayouts: 1800,
      yearMaterialsCost: 100,
      yearLaborCost: 200,
      yearMachineExpenses: 50,
      yearNetProfit: 1450,
      yearMargin: 72.5,
      yearCompletedJobs: 5,
      yearAvgJobValue: 400,
      yearAvgJobProfit: 290,
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getFinanceSummary();

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/finance/summary', {
      params: undefined,
    });
    expect(result).toEqual(mockData);
  });

  it('getFinanceSummary forwards explicit year as query param', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });

    await getFinanceSummary(2024);

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/finance/summary', {
      params: { year: 2024 },
    });
  });

  it('getMonthlyBreakdown calls GET with year param when provided', async () => {
    const mockData = { year: 2025, months: [] };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getMonthlyBreakdown(2025);

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/finance/monthly-breakdown', {
      params: { year: 2025 },
    });
    expect(result).toEqual(mockData);
  });

  it('getMonthlyBreakdown calls GET without params when no year', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { year: 2026, months: [] } });

    await getMonthlyBreakdown();

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/finance/monthly-breakdown', {
      params: undefined,
    });
  });

  it('getYearlyComparison calls GET /providers/me/finance/yearly-comparison', async () => {
    const mockData = {
      currentYear: 2026,
      previousYear: 2025,
      currentRevenue: 1000,
      previousRevenue: 800,
      revenueDeltaPct: 25,
      currentProfit: 700,
      previousProfit: 500,
      profitDeltaPct: 40,
      currentJobs: 5,
      previousJobs: 4,
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getYearlyComparison();

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/finance/yearly-comparison');
    expect(result).toEqual(mockData);
  });

  it('getFinanceTransactions calls GET /providers/me/finance/transactions with page/size', async () => {
    const mockPage = { content: [{ id: 1, amount: 150 }], totalElements: 1 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await getFinanceTransactions(1, 10);

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/finance/transactions', {
      params: { page: 1, size: 10 },
    });
    expect(result).toEqual(mockPage);
  });

  it('exportFinanceCsv calls GET with blob responseType and triggers download', async () => {
    const mockBlobData = 'csv,content,here';
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockBlobData });

    const mockUrl = 'blob:http://localhost/fake-url';
    const createObjectURLSpy = vi.fn().mockReturnValue(mockUrl);
    const revokeObjectURLSpy = vi.fn();
    window.URL.createObjectURL = createObjectURLSpy;
    window.URL.revokeObjectURL = revokeObjectURLSpy;

    const mockLink = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);

    await exportFinanceCsv('2026-01-01', '2026-03-31');

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/finance/export', {
      params: { from: '2026-01-01', to: '2026-03-31' },
      responseType: 'blob',
    });
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(mockLink.download).toBe('transacoes_2026-01-01_2026-03-31.csv');
    expect(mockLink.click).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockUrl);
  });

  it('exportFinanceCsv creates a blob with correct content type', async () => {
    const mockBlobData = 'id,amount\n1,150';
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockBlobData });

    const blobSpy = vi.fn().mockImplementation(function (this: Blob) {
      return this;
    });
    global.Blob = blobSpy as unknown as typeof Blob;

    const mockUrl = 'blob:http://localhost/fake';
    window.URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLElement);

    await exportFinanceCsv('2026-01-01', '2026-03-31');

    expect(blobSpy).toHaveBeenCalledWith([mockBlobData], { type: 'text/csv;charset=utf-8' });
  });
});
