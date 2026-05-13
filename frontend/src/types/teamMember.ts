export type TeamMemberRole = 'MANAGER' | 'LEAD' | 'OPERATOR';

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: TeamMemberRole;
  hourlyRate: number | null;
  active: boolean;
  invitedAt: string;
  joinedAt: string | null;
}

export interface CreateTeamMemberRequest {
  name: string;
  email: string;
  phone?: string;
  role: TeamMemberRole;
  hourlyRate?: number;
}

export interface UpdateTeamMemberRequest {
  name: string;
  phone?: string;
  role?: TeamMemberRole;
  hourlyRate?: number | null;
}

export interface OperatorTopMachineEntry {
  machineId: number;
  machineName: string;
  jobsCount: number;
  machineHours: number;
}

export interface OperatorAnalytics {
  operatorId: number;
  operatorName: string;
  from: string;
  to: string;
  jobsDone: number;
  hoursWorked: number;
  laborCost: number;
  revenueAttributed: number;
  profit: number;
  profitPerHour: number;
  profitPerJob: number;
  topMachines: OperatorTopMachineEntry[];
}

export interface OperatorJob {
  executionId: number;
  requestId: number | null;
  clientName: string | null;
  hoursWorked: number;
  hourlyRateSnapshot: number | null;
  laborCost: number;
  revenueAttributed: number;
  machineName: string | null;
  completedAt: string | null;
}
