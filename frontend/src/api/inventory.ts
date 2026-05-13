import { apiClient } from './client';
import type {
  InventoryItem,
  CreateInventoryItemRequest,
  UpdateInventoryItemRequest,
  InventoryMovement,
  MovementsPage,
  RecordPurchaseRequest,
  RecordAdjustmentInRequest,
  RecordAdjustmentOutRequest,
} from '@/types/inventory';

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

export async function listMovements(
  itemId: number,
  page = 0,
  size = 20,
): Promise<MovementsPage> {
  const response = await apiClient.get<MovementsPage>(
    `/providers/me/inventory/${itemId}/movements`,
    { params: { page, size } },
  );
  return response.data;
}

export async function recordPurchase(
  itemId: number,
  data: RecordPurchaseRequest,
): Promise<InventoryMovement> {
  const response = await apiClient.post<InventoryMovement>(
    `/providers/me/inventory/${itemId}/movements/purchase`,
    data,
  );
  return response.data;
}

export async function recordAdjustmentIn(
  itemId: number,
  data: RecordAdjustmentInRequest,
): Promise<InventoryMovement> {
  const response = await apiClient.post<InventoryMovement>(
    `/providers/me/inventory/${itemId}/movements/adjustment-in`,
    data,
  );
  return response.data;
}

export async function recordAdjustmentOut(
  itemId: number,
  data: RecordAdjustmentOutRequest,
): Promise<InventoryMovement> {
  const response = await apiClient.post<InventoryMovement>(
    `/providers/me/inventory/${itemId}/movements/adjustment-out`,
    data,
  );
  return response.data;
}
