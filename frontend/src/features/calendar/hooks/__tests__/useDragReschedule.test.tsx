import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { CalendarEvent } from '@/types/calendar';

const mutateUpdate = vi.fn().mockResolvedValue({});
const mutateReassign = vi.fn().mockResolvedValue({});

vi.mock('../useCalendar', () => ({
  useUpdateSchedule: () => ({ mutateAsync: mutateUpdate, isPending: false }),
  useReassignExecution: () => ({ mutateAsync: mutateReassign, isPending: false }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useDragReschedule, type DragSession, type DropTarget } from '../useDragReschedule';
import { toast } from 'sonner';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    executionId: 100,
    requestId: 1,
    requestTitle: 'Test Job',
    categoryName: 'Limpeza',
    scheduledDate: '2026-04-15',
    scheduledEndDate: '2026-04-15',
    scheduledStartTime: '09:00',
    scheduledEndTime: '11:00',
    scheduledAllDay: false,
    status: 'IN_PROGRESS',
    island: 'São Miguel',
    parish: 'Ponta Delgada',
    urgency: 'MEDIUM',
    assignments: [
      { teamMemberId: 5, teamMemberName: 'João', machineId: 9, machineName: 'Trator' },
    ],
    ...overrides,
  };
}

function makeSession(event: CalendarEvent, overrides: Partial<DragSession> = {}): DragSession {
  return {
    event,
    laneId: 'op-5',
    resourceType: 'operator',
    resourceId: 5,
    ...overrides,
  };
}

function makeTarget(overrides: Partial<DropTarget> = {}): DropTarget {
  return {
    laneId: 'op-5',
    resourceType: 'operator',
    resourceId: 5,
    dayIso: '2026-04-16',
    startSlot: 6,
    spanSlots: 4,
    ...overrides,
  };
}

beforeEach(() => {
  mutateUpdate.mockClear();
  mutateReassign.mockClear();
  mutateReassign.mockResolvedValue({});
});

describe('useDragReschedule — session lifecycle', () => {
  it('starts with no session', () => {
    const { result } = renderHook(() => useDragReschedule({ events: [] }));
    expect(result.current.session).toBeNull();
  });

  it('startDrag sets session and endDrag clears it', () => {
    const event = makeEvent();
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));

    act(() => result.current.startDrag(makeSession(event)));
    expect(result.current.session?.event.executionId).toBe(100);

    act(() => result.current.endDrag());
    expect(result.current.session).toBeNull();
  });
});

describe('useDragReschedule — previewConflict', () => {
  it('returns { conflict: false } when there is no session', () => {
    const { result } = renderHook(() => useDragReschedule({ events: [] }));
    expect(result.current.previewConflict(makeTarget())).toEqual({ conflict: false });
  });

  it('returns { conflict: false } when target is null', () => {
    const event = makeEvent();
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));
    act(() => result.current.startDrag(makeSession(event)));
    expect(result.current.previewConflict(null)).toEqual({ conflict: false });
  });

  it('uses target operator id when target is operator lane', () => {
    const event = makeEvent();
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));
    act(() => result.current.startDrag(makeSession(event)));
    const preview = result.current.previewConflict(makeTarget({ resourceType: 'operator', resourceId: 42 }));
    expect(preview).toHaveProperty('conflict');
  });

  it('falls back to event assignments when target is job lane', () => {
    const event = makeEvent();
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));
    act(() => result.current.startDrag(makeSession(event)));
    const preview = result.current.previewConflict(
      makeTarget({ resourceType: 'job', resourceId: 1 }),
    );
    expect(preview).toHaveProperty('conflict');
  });

  it('uses target machine id when target is machine lane', () => {
    const event = makeEvent();
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));
    act(() => result.current.startDrag(makeSession(event)));
    const preview = result.current.previewConflict(
      makeTarget({ resourceType: 'machine', resourceId: 9 }),
    );
    expect(preview).toHaveProperty('conflict');
  });
});

describe('useDragReschedule — applyDrop', () => {
  it('returns early when there is no session', async () => {
    const { result } = renderHook(() => useDragReschedule({ events: [] }));
    await act(async () => {
      await result.current.applyDrop(makeTarget());
    });
    expect(mutateUpdate).not.toHaveBeenCalled();
  });

  it('sends allDay payload when event is allDay', async () => {
    const event = makeEvent({ scheduledAllDay: true });
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));
    act(() => result.current.startDrag(makeSession(event)));

    await act(async () => {
      await result.current.applyDrop(makeTarget({ dayIso: '2026-04-20' }));
    });
    expect(mutateUpdate).toHaveBeenCalledWith({
      executionId: 100,
      data: { scheduledDate: '2026-04-20', scheduledEndDate: '2026-04-20', allDay: true },
    });
  });

  it('sends timed payload with computed start/end times when event is timed', async () => {
    const event = makeEvent({ scheduledAllDay: false });
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));
    act(() => result.current.startDrag(makeSession(event)));

    await act(async () => {
      await result.current.applyDrop(makeTarget({ dayIso: '2026-04-20', startSlot: 6, spanSlots: 4 }));
    });
    expect(mutateUpdate).toHaveBeenCalledTimes(1);
    const call = mutateUpdate.mock.calls[0][0];
    expect(call.executionId).toBe(100);
    expect(call.data.allDay).toBe(false);
    expect(call.data.scheduledStartTime).toMatch(/^\d{2}:\d{2}$/);
    expect(call.data.scheduledEndTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it('reassigns when switching operator', async () => {
    const event = makeEvent({ scheduledAllDay: true });
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));
    act(() => result.current.startDrag(makeSession(event, { resourceType: 'operator', resourceId: 5 })));

    await act(async () => {
      await result.current.applyDrop(makeTarget({ resourceType: 'operator', resourceId: 8 }));
    });
    expect(mutateReassign).toHaveBeenCalledWith({
      executionId: 100,
      data: { fromTeamMemberId: 5, toTeamMemberId: 8 },
    });
  });

  it('does not reassign when staying on the same operator lane', async () => {
    const event = makeEvent({ scheduledAllDay: true });
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));
    act(() => result.current.startDrag(makeSession(event, { resourceType: 'operator', resourceId: 5 })));

    await act(async () => {
      await result.current.applyDrop(makeTarget({ resourceType: 'operator', resourceId: 5 }));
    });
    expect(mutateReassign).not.toHaveBeenCalled();
  });

  it('toasts on reassign failure', async () => {
    mutateReassign.mockRejectedValueOnce(new Error('boom'));
    const event = makeEvent({ scheduledAllDay: true });
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));
    act(() => result.current.startDrag(makeSession(event, { resourceType: 'operator', resourceId: 5 })));

    await act(async () => {
      await result.current.applyDrop(makeTarget({ resourceType: 'operator', resourceId: 99 }));
    });
    expect(toast.error).toHaveBeenCalledWith('Não foi possível reatribuir o operador');
  });

  it('clears session after applyDrop', async () => {
    const event = makeEvent({ scheduledAllDay: true });
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));
    act(() => result.current.startDrag(makeSession(event)));

    await act(async () => {
      await result.current.applyDrop(makeTarget());
    });
    expect(result.current.session).toBeNull();
  });
});

describe('useDragReschedule — week-day-slot drop', () => {
  it('shifts schedule to new day and slot, preserving original duration', async () => {
    const event = makeEvent({
      scheduledAllDay: false,
      scheduledDate: '2026-04-15',
      scheduledEndDate: '2026-04-15',
      scheduledStartTime: '09:00',
      scheduledEndTime: '11:00',
    });
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));
    act(() => result.current.startDrag(makeSession(event)));

    await act(async () => {
      await result.current.applyDrop({
        type: 'week-day-slot',
        dayIso: '2026-05-15',
        slotMinute: 600,
      });
    });

    expect(mutateUpdate).toHaveBeenCalledTimes(1);
    expect(mutateUpdate).toHaveBeenCalledWith({
      executionId: 100,
      data: {
        scheduledDate: '2026-05-15',
        scheduledEndDate: '2026-05-15',
        scheduledStartTime: '10:00',
        scheduledEndTime: '12:00',
        allDay: false,
      },
    });
  });

  it('clears session after a week-day-slot drop', async () => {
    const event = makeEvent({
      scheduledAllDay: false,
      scheduledStartTime: '09:00',
      scheduledEndTime: '11:00',
    });
    const { result } = renderHook(() => useDragReschedule({ events: [event] }));
    act(() => result.current.startDrag(makeSession(event)));

    await act(async () => {
      await result.current.applyDrop({
        type: 'week-day-slot',
        dayIso: '2026-05-15',
        slotMinute: 480,
      });
    });

    expect(result.current.session).toBeNull();
  });
});
