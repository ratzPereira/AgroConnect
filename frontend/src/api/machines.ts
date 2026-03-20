import { apiClient } from './client';
import type { Machine, CreateMachineRequest, UpdateMachineRequest } from '@/types/machine';

export async function listMachines(status?: string): Promise<Machine[]> {
  const params = status ? { status } : undefined;
  const response = await apiClient.get<Machine[]>('/providers/me/machines', { params });
  return response.data;
}

export async function getMachine(id: number): Promise<Machine> {
  const response = await apiClient.get<Machine>(`/providers/me/machines/${id}`);
  return response.data;
}

export async function createMachine(data: CreateMachineRequest): Promise<Machine> {
  const response = await apiClient.post<Machine>('/providers/me/machines', data);
  return response.data;
}

export async function updateMachine(id: number, data: UpdateMachineRequest): Promise<Machine> {
  const response = await apiClient.put<Machine>(`/providers/me/machines/${id}`, data);
  return response.data;
}

export async function deleteMachine(id: number): Promise<void> {
  await apiClient.delete(`/providers/me/machines/${id}`);
}
