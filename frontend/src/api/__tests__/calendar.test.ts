import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  getCalendarEvents,
  getConflicts,
  getCalendarSummary,
  getWorkloadHeatmap,
  getMaintenanceWindows,
  getCalendarAlerts,
  updateSchedule,
  reassignExecution,
} from '../calendar';

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe('calendar API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCalendarEvents calls GET /providers/me/calendar with from/to params', async () => {
    const mockData = [{ id: 1, title: 'Lavoura' }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getCalendarEvents('2026-03-01', '2026-03-31');

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/calendar', {
      params: { from: '2026-03-01', to: '2026-03-31' },
    });
    expect(result).toEqual(mockData);
  });

  it('getConflicts calls GET /providers/me/calendar/conflicts with from/to params', async () => {
    const mockData = [{ executionId: 1, conflictsWith: 2 }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getConflicts('2026-03-01', '2026-03-31');

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/calendar/conflicts', {
      params: { from: '2026-03-01', to: '2026-03-31' },
    });
    expect(result).toEqual(mockData);
  });

  it('updateSchedule calls PATCH /providers/me/calendar/executions/{id}/schedule', async () => {
    const scheduleData = { scheduledDate: '2026-04-01T09:00:00', scheduledEndDate: '2026-04-01T17:00:00' };
    const mockData = { id: 1, ...scheduleData };
    vi.mocked(apiClient.patch).mockResolvedValue({ data: mockData });

    const result = await updateSchedule(1, scheduleData);

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/providers/me/calendar/executions/1/schedule',
      scheduleData,
    );
    expect(result).toEqual(mockData);
  });

  it('getCalendarSummary calls GET /providers/me/calendar/summary with from/to params', async () => {
    const mockData = { totalExecutions: 5, completed: 2 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getCalendarSummary('2026-03-01', '2026-03-31');

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/calendar/summary', {
      params: { from: '2026-03-01', to: '2026-03-31' },
    });
    expect(result).toEqual(mockData);
  });

  it('getWorkloadHeatmap calls GET /providers/me/calendar/workload with from/to params', async () => {
    const mockData = { cells: [{ date: '2026-03-01', load: 0.5 }] };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getWorkloadHeatmap('2026-03-01', '2026-03-31');

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/calendar/workload', {
      params: { from: '2026-03-01', to: '2026-03-31' },
    });
    expect(result).toEqual(mockData);
  });

  it('getMaintenanceWindows calls GET /providers/me/calendar/maintenance-windows', async () => {
    const mockData = [{ id: 1, machineId: 10, start: '2026-03-15T08:00:00' }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getMaintenanceWindows('2026-03-01', '2026-03-31');

    expect(apiClient.get).toHaveBeenCalledWith(
      '/providers/me/calendar/maintenance-windows',
      { params: { from: '2026-03-01', to: '2026-03-31' } },
    );
    expect(result).toEqual(mockData);
  });

  it('getCalendarAlerts calls GET /providers/me/calendar/alerts', async () => {
    const mockData = { conflicts: [], overlaps: [] };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getCalendarAlerts('2026-03-01', '2026-03-31');

    expect(apiClient.get).toHaveBeenCalledWith('/providers/me/calendar/alerts', {
      params: { from: '2026-03-01', to: '2026-03-31' },
    });
    expect(result).toEqual(mockData);
  });

  it('reassignExecution calls POST /providers/me/calendar/executions/{id}/reassign', async () => {
    const payload = { providerLeadId: 99 };
    const mockData = { id: 7, providerLeadId: 99 };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await reassignExecution(7, payload);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/providers/me/calendar/executions/7/reassign',
      payload,
    );
    expect(result).toEqual(mockData);
  });
});
