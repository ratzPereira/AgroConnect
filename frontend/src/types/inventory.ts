export type InventoryUnit = 'KG' | 'L' | 'UNIT';

export interface InventoryItem {
  id: number;
  productName: string;
  unit: InventoryUnit;
  quantity: number;
  minStockAlert: number | null;
  costPerUnit: number | null;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryItemRequest {
  productName: string;
  unit: InventoryUnit;
  quantity: number;
  minStockAlert?: number;
  costPerUnit?: number;
}

export interface UpdateInventoryItemRequest {
  quantity: number;
  minStockAlert?: number;
  costPerUnit?: number;
}
