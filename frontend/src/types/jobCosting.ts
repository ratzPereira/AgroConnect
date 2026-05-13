import type { InventoryUnit } from './inventory';

export interface AssignmentCost {
  assignmentId: number;
  teamMemberId: number;
  teamMemberName: string;
  hoursWorked: number;
  machineHours: number;
  effectiveHourlyRate: number | null;
  laborCost: number;
}

export interface ResourceUsage {
  id: number;
  inventoryItemId: number;
  productName: string;
  unit: InventoryUnit;
  quantity: number;
  unitCostSnapshot: number;
  totalCost: number;
  notes: string | null;
  inventoryMovementId: number;
  recordedById: number;
  recordedByName: string;
  createdAt: string;
}

export interface JobCosts {
  executionId: number;
  completed: boolean;
  revenue: number;
  materialsCost: number;
  laborCost: number;
  commission: number;
  commissionRate: number;
  netProfit: number;
  marginPercent: number;
  assignments: AssignmentCost[];
  resourceUsages: ResourceUsage[];
  assignmentsMissingRate: number;
}

export interface RecordResourceUsageRequest {
  inventoryItemId: number;
  quantity: number;
  notes?: string;
}

export interface UpdateAssignmentHoursRequest {
  hoursWorked: number;
  machineHours: number;
}
