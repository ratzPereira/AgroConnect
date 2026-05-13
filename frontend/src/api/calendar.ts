import { apiClient } from './client';
import type {
  CalendarAlerts,
  CalendarEvent,
  CalendarSummary,
  ConflictResponse,
  MaintenanceWindow,
  ReassignExecutionPayload,
  ScheduleUpdatePayload,
  WorkloadHeatmap,
} from '@/types/calendar';

export async function getCalendarEvents(from: string, to: string): Promise<CalendarEvent[]> {
  const response = await apiClient.get<CalendarEvent[]>('/providers/me/calendar', {
    params: { from, to },
  });
  return response.data;
}

export async function getConflicts(from: string, to: string): Promise<ConflictResponse[]> {
  const response = await apiClient.get<ConflictResponse[]>('/providers/me/calendar/conflicts', {
    params: { from, to },
  });
  return response.data;
}

export async function getCalendarSummary(from: string, to: string): Promise<CalendarSummary> {
  const response = await apiClient.get<CalendarSummary>('/providers/me/calendar/summary', {
    params: { from, to },
  });
  return response.data;
}

export async function getWorkloadHeatmap(from: string, to: string): Promise<WorkloadHeatmap> {
  const response = await apiClient.get<WorkloadHeatmap>('/providers/me/calendar/workload', {
    params: { from, to },
  });
  return response.data;
}

export async function getMaintenanceWindows(
  from: string,
  to: string,
): Promise<MaintenanceWindow[]> {
  const response = await apiClient.get<MaintenanceWindow[]>(
    '/providers/me/calendar/maintenance-windows',
    { params: { from, to } },
  );
  return response.data;
}

export async function getCalendarAlerts(from: string, to: string): Promise<CalendarAlerts> {
  const response = await apiClient.get<CalendarAlerts>('/providers/me/calendar/alerts', {
    params: { from, to },
  });
  return response.data;
}

export async function updateSchedule(
  executionId: number,
  data: ScheduleUpdatePayload,
): Promise<CalendarEvent> {
  const response = await apiClient.patch<CalendarEvent>(
    `/providers/me/calendar/executions/${executionId}/schedule`,
    data,
  );
  return response.data;
}

export async function reassignExecution(
  executionId: number,
  data: ReassignExecutionPayload,
): Promise<CalendarEvent> {
  const response = await apiClient.post<CalendarEvent>(
    `/providers/me/calendar/executions/${executionId}/reassign`,
    data,
  );
  return response.data;
}
