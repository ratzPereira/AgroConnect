import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCalendarAlerts,
  getCalendarEvents,
  getCalendarSummary,
  getConflicts,
  getMaintenanceWindows,
  getWorkloadHeatmap,
  reassignExecution,
  updateSchedule,
} from '@/api/calendar';
import type { ReassignExecutionPayload, ScheduleUpdatePayload } from '@/types/calendar';
import { toast } from 'sonner';

const TWO_MINUTES = 2 * 60 * 1000;

export function useCalendarEvents(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar-events', from, to],
    queryFn: () => getCalendarEvents(from, to),
    staleTime: TWO_MINUTES,
  });
}

export function useCalendarConflicts(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar-conflicts', from, to],
    queryFn: () => getConflicts(from, to),
    staleTime: TWO_MINUTES,
  });
}

export function useCalendarSummary(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar-summary', from, to],
    queryFn: () => getCalendarSummary(from, to),
    staleTime: TWO_MINUTES,
  });
}

export function useCalendarWorkload(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar-workload', from, to],
    queryFn: () => getWorkloadHeatmap(from, to),
    staleTime: TWO_MINUTES,
  });
}

export function useCalendarMaintenance(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar-maintenance', from, to],
    queryFn: () => getMaintenanceWindows(from, to),
    staleTime: TWO_MINUTES,
  });
}

export function useCalendarAlerts(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar-alerts', from, to],
    queryFn: () => getCalendarAlerts(from, to),
    staleTime: TWO_MINUTES,
  });
}

function invalidateCalendar(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
  queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] });
  queryClient.invalidateQueries({ queryKey: ['calendar-summary'] });
  queryClient.invalidateQueries({ queryKey: ['calendar-workload'] });
  queryClient.invalidateQueries({ queryKey: ['calendar-alerts'] });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ executionId, data }: { executionId: number; data: ScheduleUpdatePayload }) =>
      updateSchedule(executionId, data),
    onSuccess: () => {
      invalidateCalendar(queryClient);
      toast.success('Agenda atualizada');
    },
    onError: () => {
      toast.error('Erro ao atualizar a agenda');
    },
  });
}

export function useReassignExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      executionId,
      data,
    }: {
      executionId: number;
      data: ReassignExecutionPayload;
    }) => reassignExecution(executionId, data),
    onSuccess: () => {
      invalidateCalendar(queryClient);
      toast.success('Operador reatribuído');
    },
    onError: () => {
      toast.error('Erro ao reatribuir o operador');
    },
  });
}
