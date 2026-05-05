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
