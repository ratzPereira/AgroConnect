import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

let mockIsAuthenticated = true;

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: mockIsAuthenticated }),
  ),
}));

const mockSetUnreadCount = vi.fn();
vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: vi.fn(() => ({
    setUnreadCount: mockSetUnreadCount,
  })),
}));

vi.mock('@/api/notifications', () => ({
  getUnreadCount: vi.fn(() => Promise.resolve({ count: 3 })),
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockIsAuthenticated = true;
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.clearAllMocks();
  });

  it('fetches unread count when authenticated', async () => {
    const { useNotifications } = await import('../useNotifications');
    renderHook(() => useNotifications(), { wrapper });
    await vi.advanceTimersByTimeAsync(100);
    expect(mockSetUnreadCount).toHaveBeenCalledWith(3);
  });

  it('does not fetch when not authenticated', async () => {
    mockIsAuthenticated = false;
    const { useNotifications } = await import('../useNotifications');
    renderHook(() => useNotifications(), { wrapper });
    await vi.advanceTimersByTimeAsync(100);
    expect(mockSetUnreadCount).not.toHaveBeenCalled();
  });

  it('cleans up interval on unmount', async () => {
    const { useNotifications } = await import('../useNotifications');
    const { unmount } = renderHook(() => useNotifications(), { wrapper });
    await vi.advanceTimersByTimeAsync(100);
    mockSetUnreadCount.mockClear();
    unmount();
    await vi.advanceTimersByTimeAsync(60000);
    expect(mockSetUnreadCount).not.toHaveBeenCalled();
  });
});
