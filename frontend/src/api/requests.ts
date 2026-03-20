import { apiClient } from './client';
import type {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
  ServiceRequestResponse,
  ServiceRequestSummary,
  PresignedUrlResponse,
  Page,
} from '@/types/request';

export async function createRequest(data: CreateServiceRequestDto): Promise<ServiceRequestResponse> {
  const response = await apiClient.post<ServiceRequestResponse>('/requests', data);
  return response.data;
}

export async function updateRequest(id: number, data: UpdateServiceRequestDto): Promise<ServiceRequestResponse> {
  const response = await apiClient.put<ServiceRequestResponse>(`/requests/${id}`, data);
  return response.data;
}

export async function publishRequest(id: number): Promise<ServiceRequestResponse> {
  const response = await apiClient.post<ServiceRequestResponse>(`/requests/${id}/publish`);
  return response.data;
}

export async function cancelRequest(id: number): Promise<ServiceRequestResponse> {
  const response = await apiClient.post<ServiceRequestResponse>(`/requests/${id}/cancel`);
  return response.data;
}

export async function getRequest(id: number): Promise<ServiceRequestResponse> {
  const response = await apiClient.get<ServiceRequestResponse>(`/requests/${id}`);
  return response.data;
}

export async function getMyRequests(
  page = 0,
  size = 20,
  status?: string,
): Promise<Page<ServiceRequestSummary>> {
  const params: Record<string, string | number> = { page, size };
  if (status) params.status = status;
  const response = await apiClient.get<Page<ServiceRequestSummary>>('/requests/mine', { params });
  return response.data;
}

export async function getAvailableRequests(
  page = 0,
  size = 20,
): Promise<Page<ServiceRequestSummary>> {
  const response = await apiClient.get<Page<ServiceRequestSummary>>('/requests/available', {
    params: { page, size },
  });
  return response.data;
}

export async function getUploadUrl(requestId: number): Promise<PresignedUrlResponse> {
  const response = await apiClient.post<PresignedUrlResponse>(`/requests/${requestId}/photos/upload`);
  return response.data;
}

export async function confirmPhoto(requestId: number, photoUrl: string): Promise<ServiceRequestResponse> {
  const response = await apiClient.post<ServiceRequestResponse>(`/requests/${requestId}/photos`, {
    photoUrl,
  });
  return response.data;
}

export async function deletePhoto(requestId: number, photoId: number): Promise<void> {
  await apiClient.delete(`/requests/${requestId}/photos/${photoId}`);
}
