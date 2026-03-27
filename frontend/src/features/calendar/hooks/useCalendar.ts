import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCalendarEvents, getConflicts, updateSchedule } from '@/api/calendar';
import { toast } from 'sonner';

export function useCalendarEvents(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar-events', from, to],
    queryFn: () => getCalendarEvents(from, to),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCalendarConflicts(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar-conflicts', from, to],
    queryFn: () => getConflicts(from, to),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ executionId, data }: { executionId: number; data: { scheduledDate: string; scheduledEndDate: string } }) =>
      updateSchedule(executionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] });
      toast.success('Agenda atualizada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar a agenda');
    },
  });
}
