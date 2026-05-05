import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStompSubscription } from '@/hooks/useStompClient';
import { getMessages } from '@/api/chat';
import type { ChatMessage } from '@/types/chat';
import type { Page } from '@/types/request';
import { useCallback } from 'react';

export function useChatMessages(requestId: number) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['chat-messages', requestId],
    queryFn: () => getMessages(requestId),
    refetchInterval: 30_000,
  });

  useStompSubscription(
    `/topic/request/${requestId}/chat`,
    useCallback(
      (msg) => {
        const newMessage: ChatMessage = JSON.parse(msg.body);
        queryClient.setQueryData<Page<ChatMessage>>(
          ['chat-messages', requestId],
          (old) => {
            if (!old) return old;
            if (old.content.some((m) => m.id === newMessage.id)) return old;
            return { ...old, content: [...old.content, newMessage] };
          },
        );
      },
      [queryClient, requestId],
    ),
  );

  return { messages: data?.content ?? [], isLoading };
}
