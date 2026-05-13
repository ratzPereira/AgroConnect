export type InventoryUnit = 'KG' | 'L' | 'UNIT';

export type MovementType =
  | 'INITIAL'
  | 'PURCHASE'
  | 'CONSUMPTION'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT';

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
  productName?: string;
  minStockAlert?: number | null;
}

export interface InventoryMovement {
  id: number;
  movementType: MovementType;
  quantityDelta: number;
  unitCost: number | null;
  quantityAfter: number;
  wacAfter: number;
  reason: string | null;
  executionId: number | null;
  actorUserId: number | null;
  actorName: string | null;
  createdAt: string;
}

export interface RecordPurchaseRequest {
  quantity: number;
  unitCost: number;
  reason?: string;
}

export interface RecordAdjustmentInRequest {
  quantity: number;
  unitCost?: number;
  reason: string;
}

export interface RecordAdjustmentOutRequest {
  quantity: number;
  reason: string;
}

export interface MovementsPage {
  content: InventoryMovement[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
