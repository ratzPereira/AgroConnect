import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CalendarEvent, CalendarLane, CalendarView } from '@/types/calendar';

export interface CalendarFilters {
  operatorIds: number[];
  machineIds: number[];
  categories: string[];
  urgencies: Array<'LOW' | 'MEDIUM' | 'HIGH'>;
  statuses: string[];
  includeAllDay: boolean;
  islands: string[];
}

const DEFAULT_FILTERS: CalendarFilters = {
  operatorIds: [],
  machineIds: [],
  categories: [],
  urgencies: [],
  statuses: [],
  includeAllDay: true,
  islands: [],
};

function parseNumberList(value: string | null): number[] {
  if (!value) return [];
  return value.split(',').map((s) => Number.parseInt(s, 10)).filter((n) => !Number.isNaN(n));
}

function parseStringList(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
}

function isUrgency(value: string): value is 'LOW' | 'MEDIUM' | 'HIGH' {
  return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH';
}

export function useCalendarFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<CalendarFilters>(
    () => ({
      operatorIds: parseNumberList(params.get('ops')),
      machineIds: parseNumberList(params.get('mch')),
      categories: parseStringList(params.get('cat')),
      urgencies: parseStringList(params.get('urg')).filter(isUrgency),
      statuses: parseStringList(params.get('st')),
      includeAllDay: params.get('allDay') !== 'false',
      islands: parseStringList(params.get('isl')),
    }),
    [params],
  );

  const updateFilters = useCallback(
    (next: Partial<CalendarFilters>) => {
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          const merged = { ...filters, ...next };
          setOrDel(out, 'ops', merged.operatorIds.join(','));
          setOrDel(out, 'mch', merged.machineIds.join(','));
          setOrDel(out, 'cat', merged.categories.join(','));
          setOrDel(out, 'urg', merged.urgencies.join(','));
          setOrDel(out, 'st', merged.statuses.join(','));
          setOrDel(out, 'isl', merged.islands.join(','));
          if (!merged.includeAllDay) out.set('allDay', 'false');
          else out.delete('allDay');
          return out;
        },
        { replace: true },
      );
    },
    [filters, setParams],
  );

  const clearFilters = useCallback(() => {
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        ['ops', 'mch', 'cat', 'urg', 'st', 'isl', 'allDay'].forEach((k) => out.delete(k));
        return out;
      },
      { replace: true },
    );
  }, [setParams]);

  const view = (params.get('view') as CalendarView | null) ?? 'day';
  const lane = (params.get('lane') as CalendarLane | null) ?? 'operators';
  const anchor = params.get('date') ?? todayIso();

  const setView = useCallback(
    (next: CalendarView) => {
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          out.set('view', next);
          return out;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setLane = useCallback(
    (next: CalendarLane) => {
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          out.set('lane', next);
          return out;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setAnchor = useCallback(
    (next: string) => {
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          out.set('date', next);
          return out;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { filters, updateFilters, clearFilters, view, lane, anchor, setView, setLane, setAnchor, DEFAULT_FILTERS };
}

function setOrDel(out: URLSearchParams, key: string, value: string) {
  if (value && value.length > 0) out.set(key, value);
  else out.delete(key);
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function applyFilters(events: CalendarEvent[], filters: CalendarFilters): CalendarEvent[] {
  return events.filter((e) => {
    if (!filters.includeAllDay && e.scheduledAllDay) return false;
    if (filters.urgencies.length > 0 && !filters.urgencies.includes(e.urgency)) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(e.status)) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(e.categoryName)) return false;
    if (filters.islands.length > 0 && !filters.islands.includes(e.island)) return false;
    if (filters.operatorIds.length > 0) {
      const match = e.assignments.some((a) => filters.operatorIds.includes(a.teamMemberId));
      if (!match) return false;
    }
    if (filters.machineIds.length > 0) {
      const match = e.assignments.some((a) => a.machineId != null && filters.machineIds.includes(a.machineId));
      if (!match) return false;
    }
    return true;
  });
}
