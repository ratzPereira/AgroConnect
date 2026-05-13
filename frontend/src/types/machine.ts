export type MachineStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';

export type MaintenanceType = 'ROUTINE' | 'REPAIR' | 'INSPECTION';

export type ExpenseCategory = 'FUEL' | 'PARTS' | 'INSURANCE' | 'TAX' | 'OTHER';

export interface Machine {
  id: number;
  name: string;
  type: string | null;
  description: string | null;
  status: MachineStatus;
  licensePlate: string | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  createdAt: string;
}

export interface CreateMachineRequest {
  name: string;
  type?: string;
  description?: string;
  licensePlate?: string;
  nextMaintenanceDate?: string;
}

export interface UpdateMachineRequest {
  name: string;
  type?: string;
  description?: string;
  status?: MachineStatus;
  licensePlate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
}

export interface MachineAnalytics {
  machineId: number;
  machineName: string;
  from: string;
  to: string;
  jobsDone: number;
  machineHours: number;
  utilizationPercent: number;
  revenue: number;
  maintenanceCost: number;
  expensesCost: number;
  netContribution: number;
  maintenanceCount: number;
  lastMaintenanceAt: string | null;
  nextMaintenanceAt: string | null;
}

export interface MachineJob {
  executionId: number;
  requestId: number | null;
  clientName: string | null;
  revenue: number;
  machineHours: number;
  completedAt: string | null;
}

export interface MaintenanceLog {
  id: number;
  machineId: number;
  maintenanceType: MaintenanceType;
  description: string;
  cost: number | null;
  workshopName: string | null;
  performedAt: string;
  nextDueAt: string | null;
  notes: string | null;
  createdById: number;
  createdByName: string | null;
  createdAt: string;
}

export interface CreateMaintenanceLogRequest {
  maintenanceType: MaintenanceType;
  description: string;
  cost?: number;
  workshopName?: string;
  performedAt: string;
  nextDueAt?: string;
  notes?: string;
}

export interface MachineExpense {
  id: number;
  machineId: number;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  incurredAt: string;
  notes: string | null;
  createdById: number;
  createdByName: string | null;
  createdAt: string;
}

export interface CreateMachineExpenseRequest {
  category: ExpenseCategory;
  description?: string;
  amount: number;
  incurredAt: string;
  notes?: string;
}
