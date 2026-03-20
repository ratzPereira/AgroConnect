import { apiClient } from './client';
import type { InventoryItem, CreateInventoryItemRequest, UpdateInventoryItemRequest } from '@/types/inventory';

export async function listInventory(): Promise<InventoryItem[]> {
  const response = await apiClient.get<InventoryItem[]>('/providers/me/inventory');
  return response.data;
}

export async function getLowStockItems(): Promise<InventoryItem[]> {
  const response = await apiClient.get<InventoryItem[]>('/providers/me/inventory/low-stock');
  return response.data;
}

export async function getInventoryItem(id: number): Promise<InventoryItem> {
  const response = await apiClient.get<InventoryItem>(`/providers/me/inventory/${id}`);
  return response.data;
}

export async function createInventoryItem(data: CreateInventoryItemRequest): Promise<InventoryItem> {
  const response = await apiClient.post<InventoryItem>('/providers/me/inventory', data);
  return response.data;
}

export async function updateInventoryItem(id: number, data: UpdateInventoryItemRequest): Promise<InventoryItem> {
  const response = await apiClient.put<InventoryItem>(`/providers/me/inventory/${id}`, data);
  return response.data;
}

export async function deleteInventoryItem(id: number): Promise<void> {
  await apiClient.delete(`/providers/me/inventory/${id}`);
}
