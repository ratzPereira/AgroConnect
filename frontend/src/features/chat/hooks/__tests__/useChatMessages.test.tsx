import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ChatMessage } from '@/types/chat';
import type { Page } from '@/types/request';

// Mock the chat API module
vi.mock('@/api/chat', () => ({
  getMessages: vi.fn(),
}));

// Capture the STOMP subscription callback so we can invoke it in tests
let stompCallback: ((msg: { body: string }) => void) | null = null;
let stompDestination: string | null = null;

vi.mock('@/hooks/useStompClient', () => ({
  useStompSubscription: vi.fn((destination: string, callback: (msg: { body: string }) => void) => {
    stompDestination = destination;
    stompCallback = callback;
  }),
}));

import { getMessages } from '@/api/chat';
import { useChatMessages } from '../useChatMessages';

const mockMessage1: ChatMessage = {
  id: 1,
  senderId: 2,
  senderName: 'Maria Santos',
  content: 'Olá, quando pode começar?',
  sentAt: '2026-03-15T10:00:00Z',
};

const mockMessage2: ChatMessage = {
  id: 2,
  senderId: 6,
  senderName: 'António Mendes',
  content: 'Posso começar na segunda-feira.',
  sentAt: '2026-03-15T10:05:00Z',
};

const mockPage: Page<ChatMessage> = {
  content: [mockMessage1],
  totalPages: 1,
  totalElements: 1,
  number: 0,
  size: 50,
  first: true,
  last: true,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useChatMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stompCallback = null;
    stompDestination = null;
  });

  it('should fetch messages for the given requestId', async () => {
    vi.mocked(getMessages).mockResolvedValue(mockPage);

    const { result } = renderHook(() => useChatMessages(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMessages).toHaveBeenCalledWith(42);
    expect(result.current.messages).toEqual([mockMessage1]);
  });

  it('should return empty array when no messages exist', async () => {
    vi.mocked(getMessages).mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 50,
      first: true,
      last: true,
    });

    const { result } = renderHook(() => useChatMessages(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.messages).toEqual([]);
  });

  it('should subscribe to the correct STOMP topic', async () => {
    vi.mocked(getMessages).mockResolvedValue(mockPage);

    renderHook(() => useChatMessages(42), {
      wrapper: createWrapper(),
    });

    expect(stompDestination).toBe('/topic/request/42/chat');
  });

  it('should add new message from STOMP to the cache', async () => {
    vi.mocked(getMessages).mockResolvedValue(mockPage);

    const { result } = renderHook(() => useChatMessages(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Simulate a STOMP message arriving
    expect(stompCallback).not.toBeNull();
    stompCallback!({ body: JSON.stringify(mockMessage2) });

    await waitFor(() => expect(result.current.messages).toHaveLength(2));

    expect(result.current.messages[1]).toEqual(mockMessage2);
  });

  it('should deduplicate messages with the same id from STOMP', async () => {
    vi.mocked(getMessages).mockResolvedValue(mockPage);

    const { result } = renderHook(() => useChatMessages(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Send a duplicate of message 1 via STOMP
    stompCallback!({ body: JSON.stringify(mockMessage1) });

    // Wait a tick and verify no duplicate was added
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    expect(result.current.messages[0].id).toBe(1);
  });
});
