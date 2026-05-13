import { apiClient } from './client';
import type {
  Machine,
  CreateMachineRequest,
  UpdateMachineRequest,
  MachineAnalytics,
  MachineJob,
  MaintenanceLog,
  CreateMaintenanceLogRequest,
  MachineExpense,
  CreateMachineExpenseRequest,
} from '@/types/machine';
import type { Page } from '@/types/request';

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

export async function getMachineAnalytics(
  id: number,
  from?: string,
  to?: string,
): Promise<MachineAnalytics> {
  const response = await apiClient.get<MachineAnalytics>(
    `/providers/me/machines/${id}/details`,
    { params: { from, to } },
  );
  return response.data;
}

export async function listMachineJobs(
  id: number,
  from?: string,
  to?: string,
  page = 0,
  size = 10,
): Promise<Page<MachineJob>> {
  const response = await apiClient.get<Page<MachineJob>>(
    `/providers/me/machines/${id}/jobs`,
    { params: { from, to, page, size } },
  );
  return response.data;
}

export async function listMaintenance(id: number): Promise<MaintenanceLog[]> {
  const response = await apiClient.get<MaintenanceLog[]>(
    `/providers/me/machines/${id}/maintenance`,
  );
  return response.data;
}

export async function createMaintenance(
  id: number,
  data: CreateMaintenanceLogRequest,
): Promise<MaintenanceLog> {
  const response = await apiClient.post<MaintenanceLog>(
    `/providers/me/machines/${id}/maintenance`,
    data,
  );
  return response.data;
}

export async function deleteMaintenance(machineId: number, logId: number): Promise<void> {
  await apiClient.delete(`/providers/me/machines/${machineId}/maintenance/${logId}`);
}

export async function listMachineExpenses(id: number): Promise<MachineExpense[]> {
  const response = await apiClient.get<MachineExpense[]>(
    `/providers/me/machines/${id}/expenses`,
  );
  return response.data;
}

export async function createMachineExpense(
  id: number,
  data: CreateMachineExpenseRequest,
): Promise<MachineExpense> {
  const response = await apiClient.post<MachineExpense>(
    `/providers/me/machines/${id}/expenses`,
    data,
  );
  return response.data;
}

export async function deleteMachineExpense(
  machineId: number,
  expenseId: number,
): Promise<void> {
  await apiClient.delete(`/providers/me/machines/${machineId}/expenses/${expenseId}`);
}
