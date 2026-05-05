import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import { createReview, getRequestReviews, getProviderReviews, getMyReviews } from '../reviews';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('reviews API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createReview calls POST /requests/{id}/reviews', async () => {
    const reviewData = { rating: 5, comment: 'Excelente trabalho!' };
    const mockResponse = { id: 1, requestId: 10, ...reviewData };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await createReview(10, reviewData as never);

    expect(apiClient.post).toHaveBeenCalledWith('/requests/10/reviews', reviewData);
    expect(result).toEqual(mockResponse);
  });

  it('getRequestReviews calls GET /requests/{id}/reviews', async () => {
    const mockData = [{ id: 1, rating: 5 }, { id: 2, rating: 4 }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getRequestReviews(10);

    expect(apiClient.get).toHaveBeenCalledWith('/requests/10/reviews');
    expect(result).toEqual(mockData);
  });

  it('getProviderReviews calls GET /providers/{id}/reviews with page/size', async () => {
    const mockPage = { content: [], totalElements: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await getProviderReviews(3, 1, 10);

    expect(apiClient.get).toHaveBeenCalledWith('/providers/3/reviews', {
      params: { page: 1, size: 10 },
    });
    expect(result).toEqual(mockPage);
  });

  it('getMyReviews calls GET /users/me/reviews with page/size', async () => {
    const mockPage = { content: [{ id: 1 }], totalElements: 1 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockPage });

    const result = await getMyReviews(0, 5);

    expect(apiClient.get).toHaveBeenCalledWith('/users/me/reviews', {
      params: { page: 0, size: 5 },
    });
    expect(result).toEqual(mockPage);
  });
});
