import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import { getRequestPins } from '../pins';

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('pins API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRequestPins calls GET /requests/pins', async () => {
    const mockData = [
      { id: 1, latitude: 38.65, longitude: -27.21, title: 'Lavoura' },
      { id: 2, latitude: 37.74, longitude: -25.66, title: 'Pulverizacao' },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getRequestPins();

    expect(apiClient.get).toHaveBeenCalledWith('/requests/pins');
    expect(result).toEqual(mockData);
  });
});
