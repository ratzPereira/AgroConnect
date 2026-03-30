import { apiClient } from './client';
import type {
  Listing,
  ListingSummary,
  ListingStats,
  ListingConversation,
  ListingMessage,
  CreateListingDto,
  UpdateListingDto,
} from '@/types/listing';
import type { Page, PresignedUrlResponse } from '@/types/request';

export interface SearchListingsParams {
  page?: number;
  size?: number;
  search?: string;
  category?: string;
  island?: string;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export async function searchListings(
  params: SearchListingsParams = {},
): Promise<Page<ListingSummary>> {
  const { page = 0, size = 20, ...filters } = params;
  const queryParams: Record<string, string | number> = { page, size };
  if (filters.search) queryParams.q = filters.search;
  if (filters.category) queryParams.category = filters.category;
  if (filters.island) queryParams.island = filters.island;
  if (filters.minPrice !== undefined) queryParams.minPrice = filters.minPrice;
  if (filters.maxPrice !== undefined) queryParams.maxPrice = filters.maxPrice;
  if (filters.latitude !== undefined) queryParams.lat = filters.latitude;
  if (filters.longitude !== undefined) queryParams.lng = filters.longitude;
  if (filters.radiusKm !== undefined) queryParams.radius = filters.radiusKm;

  const response = await apiClient.get<Page<ListingSummary>>('/listings', { params: queryParams });
  return response.data;
}

export async function getListingById(id: number): Promise<Listing> {
  const response = await apiClient.get<Listing>(`/listings/${id}`);
  return response.data;
}

export async function createListing(data: CreateListingDto): Promise<Listing> {
  const response = await apiClient.post<Listing>('/listings', data);
  return response.data;
}

export async function updateListing(id: number, data: UpdateListingDto): Promise<Listing> {
  const response = await apiClient.put<Listing>(`/listings/${id}`, data);
  return response.data;
}

export async function markListingSold(id: number): Promise<Listing> {
  const response = await apiClient.post<Listing>(`/listings/${id}/sold`);
  return response.data;
}

export async function removeListing(id: number): Promise<void> {
  await apiClient.delete(`/listings/${id}`);
}

export async function getMyListings(
  page = 0,
  size = 20,
  status?: string,
): Promise<Page<ListingSummary>> {
  const params: Record<string, string | number> = { page, size };
  if (status) params.status = status;
  const response = await apiClient.get<Page<ListingSummary>>('/listings/me', { params });
  return response.data;
}

export async function getMyListingStats(): Promise<ListingStats> {
  const response = await apiClient.get<ListingStats>('/listings/me/stats');
  return response.data;
}

export async function getListingUploadUrl(listingId: number): Promise<PresignedUrlResponse> {
  const response = await apiClient.post<PresignedUrlResponse>(`/listings/${listingId}/photos/upload-url`);
  return response.data;
}

export async function confirmListingPhoto(listingId: number, photoUrl: string): Promise<void> {
  await apiClient.post(`/listings/${listingId}/photos`, { photoUrl });
}

export async function deleteListingPhoto(listingId: number, photoId: number): Promise<void> {
  await apiClient.delete(`/listings/${listingId}/photos/${photoId}`);
}

export async function toggleFavorite(listingId: number): Promise<{ favorited: boolean }> {
  const response = await apiClient.post<{ favorited: boolean }>(`/listings/${listingId}/favorite`);
  return response.data;
}

export async function getMyFavorites(
  page = 0,
  size = 20,
): Promise<Page<ListingSummary>> {
  const response = await apiClient.get<Page<ListingSummary>>('/listings/favorites', { params: { page, size } });
  return response.data;
}

export async function sendListingMessage(
  listingId: number,
  content: string,
): Promise<ListingMessage> {
  const response = await apiClient.post<ListingMessage>(`/listings/${listingId}/messages`, { content });
  return response.data;
}

export async function getMyConversations(
  page = 0,
  size = 20,
): Promise<Page<ListingConversation>> {
  const response = await apiClient.get<Page<ListingConversation>>('/listings/conversations', {
    params: { page, size },
  });
  return response.data;
}

export async function getConversationMessages(
  conversationId: number,
  page = 0,
  size = 50,
): Promise<Page<ListingMessage>> {
  const response = await apiClient.get<Page<ListingMessage>>(
    `/listings/conversations/${conversationId}/messages`,
    { params: { page, size } },
  );
  return response.data;
}

export async function replyToConversation(
  conversationId: number,
  content: string,
): Promise<ListingMessage> {
  const response = await apiClient.post<ListingMessage>(
    `/listings/conversations/${conversationId}/messages`,
    { content },
  );
  return response.data;
}

export async function markConversationRead(conversationId: number): Promise<void> {
  await apiClient.post(`/listings/conversations/${conversationId}/read`);
}
