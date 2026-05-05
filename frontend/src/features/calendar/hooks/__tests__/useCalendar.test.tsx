import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock the calendar API module
vi.mock('@/api/calendar', () => ({
  getCalendarEvents: vi.fn(),
  getConflicts: vi.fn(),
  updateSchedule: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { getCalendarEvents, getConflicts, updateSchedule } from '@/api/calendar';
import { useCalendarEvents, useCalendarConflicts, useUpdateSchedule } from '../useCalendar';
import { toast } from 'sonner';
import type { CalendarEvent, ConflictResponse } from '@/types/calendar';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const mockEvent: CalendarEvent = {
  executionId: 1,
  requestId: 10,
  requestTitle: 'Lavoura de terreno',
  categoryName: 'Preparação de Solo',
  scheduledDate: '2026-04-01T09:00:00',
  scheduledEndDate: '2026-04-01T17:00:00',
  status: 'IN_PROGRESS',
  island: 'Terceira',
  parish: 'Angra do Heroísmo',
  urgency: 'MEDIUM',
  assignments: [],
};

const mockConflict: ConflictResponse = {
  date: '2026-04-01',
  resourceType: 'TEAM_MEMBER',
  resourceId: 5,
  resourceName: 'João Silva',
  conflictingEvents: [
    { executionId: 1, requestTitle: 'Lavoura de terreno' },
    { executionId: 2, requestTitle: 'Limpeza de pastagem' },
  ],
};

describe('useCalendarEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch calendar events for the given date range', async () => {
    vi.mocked(getCalendarEvents).mockResolvedValue([mockEvent]);

    const { result } = renderHook(
      () => useCalendarEvents('2026-04-01', '2026-04-30'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getCalendarEvents).toHaveBeenCalledWith('2026-04-01', '2026-04-30');
    expect(result.current.data).toEqual([mockEvent]);
  });

  it('should return empty array when no events exist', async () => {
    vi.mocked(getCalendarEvents).mockResolvedValue([]);

    const { result } = renderHook(
      () => useCalendarEvents('2026-05-01', '2026-05-31'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('should set error state when API call fails', async () => {
    vi.mocked(getCalendarEvents).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useCalendarEvents('2026-04-01', '2026-04-30'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useCalendarConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch calendar conflicts for the given date range', async () => {
    vi.mocked(getConflicts).mockResolvedValue([mockConflict]);

    const { result } = renderHook(
      () => useCalendarConflicts('2026-04-01', '2026-04-30'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getConflicts).toHaveBeenCalledWith('2026-04-01', '2026-04-30');
    expect(result.current.data).toEqual([mockConflict]);
  });

  it('should return empty array when no conflicts exist', async () => {
    vi.mocked(getConflicts).mockResolvedValue([]);

    const { result } = renderHook(
      () => useCalendarConflicts('2026-04-01', '2026-04-30'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});

describe('useUpdateSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call updateSchedule with correct params and show success toast', async () => {
    const updatedEvent = { ...mockEvent, scheduledDate: '2026-04-02T09:00:00' };
    vi.mocked(updateSchedule).mockResolvedValue(updatedEvent);

    const { result } = renderHook(
      () => useUpdateSchedule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      executionId: 1,
      data: { scheduledDate: '2026-04-02T09:00:00', scheduledEndDate: '2026-04-02T17:00:00' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateSchedule).toHaveBeenCalledWith(1, {
      scheduledDate: '2026-04-02T09:00:00',
      scheduledEndDate: '2026-04-02T17:00:00',
    });
    expect(toast.success).toHaveBeenCalledWith('Agenda atualizada com sucesso');
  });

  it('should show error toast when mutation fails', async () => {
    vi.mocked(updateSchedule).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(
      () => useUpdateSchedule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      executionId: 1,
      data: { scheduledDate: '2026-04-02T09:00:00', scheduledEndDate: '2026-04-02T17:00:00' },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar a agenda');
  });
});
