import { apiClient } from './client';
import axios from 'axios';
import type { ServiceExecution } from '@/types/execution';
import type { PresignedUrlResponse } from '@/types/request';

export async function getExecutionByRequest(requestId: number): Promise<ServiceExecution | null> {
  try {
    const response = await apiClient.get<ServiceExecution>(`/executions/request/${requestId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function assignExecution(
  executionId: number,
  data: { teamMemberId: number; machineId?: number },
): Promise<ServiceExecution> {
  const response = await apiClient.post<ServiceExecution>(`/executions/${executionId}/assign`, data);
  return response.data;
}

export async function checkinExecution(
  executionId: number,
  data: { latitude: number; longitude: number },
): Promise<ServiceExecution> {
  const response = await apiClient.post<ServiceExecution>(`/executions/${executionId}/checkin`, data);
  return response.data;
}

export async function getPhotoUploadUrl(executionId: number): Promise<PresignedUrlResponse> {
  const response = await apiClient.post<PresignedUrlResponse>(`/executions/${executionId}/photos/upload`);
  return response.data;
}

export async function confirmExecutionPhoto(
  executionId: number,
  data: { photoUrl: string; latitude?: number; longitude?: number; takenAt?: string },
): Promise<ServiceExecution> {
  const response = await apiClient.post<ServiceExecution>(`/executions/${executionId}/photos`, data);
  return response.data;
}

export async function completeExecution(
  executionId: number,
  data: { notes?: string; materialsUsed?: string },
): Promise<ServiceExecution> {
  const response = await apiClient.post<ServiceExecution>(`/executions/${executionId}/complete`, data);
  return response.data;
}
