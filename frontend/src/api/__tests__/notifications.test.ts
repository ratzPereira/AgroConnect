import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../notifications';

vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('notifications API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyNotifications calls GET /notifications/me with page/size params', async () => {
    const mockData = { content: [], totalElements: 0, totalPages: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getMyNotifications(1, 10);

    expect(apiClient.get).toHaveBeenCalledWith('/notifications/me', {
      params: { page: 1, size: 10 },
    });
    expect(result).toEqual(mockData);
  });

  it('getUnreadCount calls GET /notifications/unread-count', async () => {
    const mockData = { count: 5 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await getUnreadCount();

    expect(apiClient.get).toHaveBeenCalledWith('/notifications/unread-count');
    expect(result).toEqual(mockData);
  });

  it('markAsRead calls POST /notifications/{id}/read', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});

    await markAsRead(42);

    expect(apiClient.post).toHaveBeenCalledWith('/notifications/42/read');
  });

  it('markAllAsRead calls POST /notifications/mark-read', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});

    await markAllAsRead();

    expect(apiClient.post).toHaveBeenCalledWith('/notifications/mark-read');
  });
});
