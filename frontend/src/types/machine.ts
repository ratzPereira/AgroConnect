export type MachineStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';

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
