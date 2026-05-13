import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { CalendarEvent } from '@/types/calendar';
import { useCalendarFilters, applyFilters } from '../useCalendarFilters';

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/calendar']}>
      <Routes>
        <Route path="/calendar" element={<>{children}</>} />
      </Routes>
    </MemoryRouter>
  );
}

const baseEvent: CalendarEvent = {
  executionId: 1,
  requestId: 11,
  requestTitle: 'Lavoura A',
  categoryName: 'Preparação',
  scheduledDate: '2026-04-15',
  scheduledEndDate: '2026-04-15',
  scheduledStartTime: '09:00',
  scheduledEndTime: '12:00',
  scheduledAllDay: false,
  status: 'IN_PROGRESS',
  island: 'Terceira',
  parish: 'Angra do Heroísmo',
  urgency: 'MEDIUM',
  assignments: [{ teamMemberId: 1, teamMemberName: 'João Silva', machineId: 5, machineName: 'Trator' }],
};

describe('useCalendarFilters', () => {
  it('returns defaults for view/lane and empty filters', () => {
    const { result } = renderHook(() => useCalendarFilters(), { wrapper });
    expect(result.current.view).toBe('day');
    expect(result.current.lane).toBe('operators');
    expect(result.current.filters.urgencies).toEqual([]);
    expect(result.current.filters.includeAllDay).toBe(true);
  });

  it('updates filters and persists in url params', () => {
    const { result } = renderHook(() => useCalendarFilters(), { wrapper });
    act(() => result.current.updateFilters({ urgencies: ['HIGH'] }));
    expect(result.current.filters.urgencies).toEqual(['HIGH']);
    act(() => result.current.updateFilters({ urgencies: [] }));
    expect(result.current.filters.urgencies).toEqual([]);
  });

  it('changes the view/lane/anchor through setters', () => {
    const { result } = renderHook(() => useCalendarFilters(), { wrapper });
    act(() => result.current.setView('week'));
    expect(result.current.view).toBe('week');
    act(() => result.current.setLane('machines'));
    expect(result.current.lane).toBe('machines');
    act(() => result.current.setAnchor('2026-05-01'));
    expect(result.current.anchor).toBe('2026-05-01');
  });

  it('clears all filters', () => {
    const { result } = renderHook(() => useCalendarFilters(), { wrapper });
    act(() => result.current.updateFilters({ urgencies: ['HIGH'], includeAllDay: false }));
    act(() => result.current.clearFilters());
    expect(result.current.filters.urgencies).toEqual([]);
    expect(result.current.filters.includeAllDay).toBe(true);
  });
});

describe('applyFilters', () => {
  it('keeps everything when no filters are set', () => {
    const out = applyFilters([baseEvent], {
      operatorIds: [], machineIds: [], categories: [], urgencies: [], statuses: [], includeAllDay: true, islands: [],
    });
    expect(out).toHaveLength(1);
  });

  it('filters by urgency', () => {
    expect(
      applyFilters([baseEvent], {
        operatorIds: [], machineIds: [], categories: [], urgencies: ['HIGH'], statuses: [], includeAllDay: true, islands: [],
      }),
    ).toHaveLength(0);
  });

  it('filters by operator', () => {
    expect(
      applyFilters([baseEvent], {
        operatorIds: [99], machineIds: [], categories: [], urgencies: [], statuses: [], includeAllDay: true, islands: [],
      }),
    ).toHaveLength(0);
    expect(
      applyFilters([baseEvent], {
        operatorIds: [1], machineIds: [], categories: [], urgencies: [], statuses: [], includeAllDay: true, islands: [],
      }),
    ).toHaveLength(1);
  });

  it('filters out all-day events when toggle is off', () => {
    const allDay = { ...baseEvent, scheduledAllDay: true } as CalendarEvent;
    expect(
      applyFilters([allDay], {
        operatorIds: [], machineIds: [], categories: [], urgencies: [], statuses: [], includeAllDay: false, islands: [],
      }),
    ).toHaveLength(0);
  });
});
