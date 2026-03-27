import { apiClient } from './client';
import type { CalendarEvent, ConflictResponse } from '@/types/calendar';

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

export async function updateSchedule(
  executionId: number,
  data: { scheduledDate: string; scheduledEndDate: string },
): Promise<CalendarEvent> {
  const response = await apiClient.patch<CalendarEvent>(
    `/providers/me/calendar/executions/${executionId}/schedule`,
    data,
  );
  return response.data;
}
