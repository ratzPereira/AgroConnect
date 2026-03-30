import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import { getMyTransactions, getTransaction } from '../transactions';

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('transactions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyTransactions calls GET /transactions/me with page/size', async () => {
    const mockPage = { content: [{ id: 1, amount: 150 }], totalElements: 1 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await getMyTransactions(0, 10);

    expect(apiClient.get).toHaveBeenCalledWith('/transactions/me', {
      params: { page: 0, size: 10 },
    });
    expect(result).toEqual(mockPage);
  });

  it('getTransaction calls GET /transactions/{id}', async () => {
    const mockData = { id: 42, amount: 250, status: 'COMPLETED' };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getTransaction(42);

    expect(apiClient.get).toHaveBeenCalledWith('/transactions/42');
    expect(result).toEqual(mockData);
  });
});
