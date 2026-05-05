import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import { getCalendarEvents, getConflicts, updateSchedule } from '../calendar';

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
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
});
