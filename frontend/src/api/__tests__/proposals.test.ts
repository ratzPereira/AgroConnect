import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  createProposal,
  getRequestProposals,
  getMyProposals,
  acceptProposal,
  withdrawProposal,
} from '../proposals';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('proposals API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createProposal calls POST /requests/{id}/proposals', async () => {
    const dto = { price: 150.0, estimatedDuration: 3, message: 'Posso fazer este trabalho' };
    const mockResponse = { id: 1, requestId: 5, ...dto };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await createProposal(5, dto as never);

    expect(apiClient.post).toHaveBeenCalledWith('/requests/5/proposals', dto);
    expect(result).toEqual(mockResponse);
  });

  it('getRequestProposals calls GET /requests/{id}/proposals', async () => {
    const mockData = [{ id: 1 }, { id: 2 }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getRequestProposals(5);

    expect(apiClient.get).toHaveBeenCalledWith('/requests/5/proposals');
    expect(result).toEqual(mockData);
  });

  it('getMyProposals calls GET /proposals/mine with page/size', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await getMyProposals(1, 15);

    expect(apiClient.get).toHaveBeenCalledWith('/proposals/mine', {
      params: { page: 1, size: 15 },
    });
    expect(result).toEqual(mockPage);
  });

  it('acceptProposal calls POST /proposals/{id}/accept', async () => {
    const mockResponse = {
      transactionId: 7,
      proposalId: 10,
      paymentIntentId: 'pi_test_123',
      clientSecret: 'pi_test_123_secret_xyz',
      amount: 300.0,
      publishableKey: 'pk_test_abc',
    };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await acceptProposal(10);

    expect(apiClient.post).toHaveBeenCalledWith('/proposals/10/accept');
    expect(result).toEqual(mockResponse);
  });

  it('withdrawProposal calls POST /proposals/{id}/withdraw', async () => {
    const mockResponse = { id: 10, status: 'WITHDRAWN' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await withdrawProposal(10);

    expect(apiClient.post).toHaveBeenCalledWith('/proposals/10/withdraw');
    expect(result).toEqual(mockResponse);
  });
});
