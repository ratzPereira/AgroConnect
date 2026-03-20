import { apiClient } from './client';
import type { Review, CreateReviewRequest } from '@/types/review';
import type { Page } from '@/types/request';

export async function createReview(requestId: number, data: CreateReviewRequest): Promise<Review> {
  const response = await apiClient.post<Review>(`/requests/${requestId}/reviews`, data);
  return response.data;
}

export async function getProviderReviews(
  providerId: number,
  page = 0,
  size = 20,
): Promise<Page<Review>> {
  const response = await apiClient.get<Page<Review>>(`/providers/${providerId}/reviews`, {
    params: { page, size },
  });
  return response.data;
}

export async function getMyReviews(page = 0, size = 20): Promise<Page<Review>> {
  const response = await apiClient.get<Page<Review>>('/users/me/reviews', {
    params: { page, size },
  });
  return response.data;
}
