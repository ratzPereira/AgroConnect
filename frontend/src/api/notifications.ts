import { apiClient } from './client';
import type { Notification, UnreadCount } from '@/types/notification';
import type { Page } from '@/types/request';

export async function getMyNotifications(page = 0, size = 20): Promise<Page<Notification>> {
  const response = await apiClient.get<Page<Notification>>('/notifications/me', {
    params: { page, size },
  });
  return response.data;
}

export async function getUnreadCount(): Promise<UnreadCount> {
  const response = await apiClient.get<UnreadCount>('/notifications/unread-count');
  return response.data;
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.post('/notifications/mark-read');
}
