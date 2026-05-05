import { apiClient } from './client';
import type { ChatMessage, SendMessageRequest } from '@/types/chat';
import type { Page } from '@/types/request';

export async function getMessages(requestId: number, page = 0, size = 50): Promise<Page<ChatMessage>> {
  const response = await apiClient.get<Page<ChatMessage>>(`/requests/${requestId}/messages`, {
    params: { page, size },
  });
  return response.data;
}

export async function sendMessage(requestId: number, data: SendMessageRequest): Promise<ChatMessage> {
  const response = await apiClient.post<ChatMessage>(`/requests/${requestId}/messages`, data);
  return response.data;
}
