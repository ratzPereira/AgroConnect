import { useCallback, useState } from 'react';
import type { CalendarEvent } from '@/types/calendar';
import { useUpdateSchedule, useReassignExecution } from './useCalendar';
import { eventsConflict, describeProposedTime } from '../utils/conflictCheck';
import { slotToTime, formatTime } from '../utils/timeMath';
import { toast } from 'sonner';

export interface DragSession {
  event: CalendarEvent;
  laneId: string;
  resourceType: 'operator' | 'machine' | 'job';
  resourceId: number | null;
}

export interface DropTarget {
  laneId: string;
  resourceType: 'operator' | 'machine' | 'job';
  resourceId: number | null;
  dayIso: string;
  startSlot: number;
  spanSlots: number;
}

interface UseDragRescheduleOptions {
  events: CalendarEvent[];
}

export function useDragReschedule({ events }: UseDragRescheduleOptions) {
  const updateSchedule = useUpdateSchedule();
  const reassign = useReassignExecution();
  const [session, setSession] = useState<DragSession | null>(null);

  const startDrag = useCallback((s: DragSession) => setSession(s), []);
  const endDrag = useCallback(() => setSession(null), []);

  const previewConflict = useCallback(
    (target: DropTarget | null) => {
      if (!session || !target) return { conflict: false };
      const operatorIds =
        target.resourceType === 'operator' && target.resourceId != null
          ? [target.resourceId]
          : session.event.assignments.map((a) => a.teamMemberId);
      const machineIds =
        target.resourceType === 'machine' && target.resourceId != null
          ? [target.resourceId]
          : session.event.assignments.flatMap((a) => (a.machineId != null ? [a.machineId] : []));
      return eventsConflict(
        {
          executionId: session.event.executionId,
          dayIso: target.dayIso,
          startSlot: target.startSlot,
          spanSlots: target.spanSlots,
          operatorIds,
          machineIds,
        },
        events,
      );
    },
    [events, session],
  );

  const applyDrop = useCallback(
    async (target: DropTarget) => {
      if (!session) return;
      const event = session.event;
      const isAllDay = event.scheduledAllDay;
      const wasOperatorLane = session.resourceType === 'operator';
      const switchingOperator =
        wasOperatorLane &&
        target.resourceType === 'operator' &&
        target.resourceId !== session.resourceId;

      if (!isAllDay) {
        const start = slotToTime(target.startSlot);
        const end = slotToTime(target.startSlot + target.spanSlots);
        await updateSchedule.mutateAsync({
          executionId: event.executionId,
          data: {
            scheduledDate: target.dayIso,
            scheduledEndDate: target.dayIso,
            scheduledStartTime: formatTime(start),
            scheduledEndTime: formatTime(end),
            allDay: false,
          },
        });
      } else {
        await updateSchedule.mutateAsync({
          executionId: event.executionId,
          data: {
            scheduledDate: target.dayIso,
            scheduledEndDate: target.dayIso,
            allDay: true,
          },
        });
      }

      if (switchingOperator && session.resourceId != null && target.resourceId != null) {
        try {
          await reassign.mutateAsync({
            executionId: event.executionId,
            data: {
              fromTeamMemberId: session.resourceId,
              toTeamMemberId: target.resourceId,
            },
          });
        } catch {
          toast.error('Não foi possível reatribuir o operador');
        }
      }

      setSession(null);
    },
    [session, updateSchedule, reassign],
  );

  return {
    session,
    startDrag,
    endDrag,
    previewConflict,
    applyDrop,
    isPending: updateSchedule.isPending || reassign.isPending,
    describeProposedTime,
  };
}
