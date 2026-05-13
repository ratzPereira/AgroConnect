import type { RequestStatus } from './request';

export interface CalendarAssignment {
  teamMemberId: number;
  teamMemberName: string;
  machineId: number | null;
  machineName: string | null;
}

export interface CalendarEvent {
  executionId: number;
  requestId: number;
  requestTitle: string;
  categoryName: string;
  scheduledDate: string;
  scheduledEndDate: string;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  scheduledAllDay: boolean;
  status: RequestStatus;
  island: string;
  parish: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  assignments: CalendarAssignment[];
}

export interface ConflictingEvent {
  executionId: number;
  requestTitle: string;
}

export interface ConflictResponse {
  date: string;
  resourceType: 'TEAM_MEMBER' | 'MACHINE';
  resourceId: number;
  resourceName: string;
  conflictingEvents: ConflictingEvent[];
}

export interface CalendarSummary {
  totalEvents: number;
  inProgress: number;
  awaitingConfirmation: number;
  completed: number;
  conflicting: number;
  totalRevenue: number;
  activeOperators: number;
  activeMachines: number;
  operatorUtilization: number;
}

export interface OperatorWorkload {
  teamMemberId: number;
  teamMemberName: string;
  role: string;
  minutesByDate: Record<string, number>;
  totalMinutes: number;
}

export interface WorkloadHeatmap {
  from: string;
  to: string;
  operators: OperatorWorkload[];
}

export interface MaintenanceWindow {
  id: number;
  machineId: number;
  machineName: string;
  performedAt: string;
  nextDueAt: string | null;
  description: string;
}

export interface ConflictAlert {
  date: string;
  resourceType: 'TEAM_MEMBER' | 'MACHINE';
  resourceId: number;
  resourceName: string;
  overlappingCount: number;
}

export interface MaintenanceAlert {
  maintenanceLogId: number;
  machineId: number;
  machineName: string;
  dueDate: string;
  description: string;
}

export interface PaymentAlert {
  executionId: number;
  requestTitle: string;
  completedOn: string;
  daysAwaiting: number;
}

export interface ProposalAlert {
  requestId: number;
  requestTitle: string;
  competingProposals: number;
  submittedOn: string;
}

export interface CalendarAlerts {
  conflicts: ConflictAlert[];
  maintenance: MaintenanceAlert[];
  payments: PaymentAlert[];
  proposals: ProposalAlert[];
}

export interface ScheduleUpdatePayload {
  scheduledDate: string;
  scheduledEndDate: string;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  allDay?: boolean;
}

export interface ReassignExecutionPayload {
  fromTeamMemberId: number;
  toTeamMemberId: number;
  machineId?: number | null;
}

export type CalendarView = 'day' | 'week' | 'month';
export type CalendarLane = 'operators' | 'machines' | 'jobs';

export type GanttView = 'jobs' | 'team' | 'machines';

export interface GanttRow {
  id: string;
  label: string;
  sublabel?: string;
  bars: GanttBar[];
}

export interface GanttBar {
  executionId: number;
  requestId: number;
  requestTitle: string;
  categoryName: string;
  startDate: string;
  endDate: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: RequestStatus;
  island: string;
  parish: string;
  hasConflict?: boolean;
}
