import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import { getFinanceSummary, getFinanceTransactions, exportFinanceCsv } from '../finance';

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('finance API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getFinanceSummary calls GET /providers/me/finance/summary', async () => {
    const mockData = {
      totalRevenue: 5000,
      totalCommissions: 500,
      totalEarnings: 4500,
      pendingPayouts: 200,
      thisMonthEarnings: 1000,
      completedJobs: 15,
      avgJobValue: 333,
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getFinanceSummary();

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/finance/summary');
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
