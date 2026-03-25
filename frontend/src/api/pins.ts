import { apiClient } from './client';
import type { RequestPin } from '@/types/pin';

export async function getRequestPins(): Promise<RequestPin[]> {
  const { data } = await apiClient.get<RequestPin[]>('/requests/pins');
  return data;
}
