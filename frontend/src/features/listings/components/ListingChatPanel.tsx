import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sendListingMessage,
  getConversationMessages,
  getMyConversations,
  replyToConversation,
  markConversationRead,
} from '@/api/listings';
import { useAuthStore } from '@/stores/authStore';
import { useStompSubscription } from '@/hooks/useStompClient';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Send, MessageSquare } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ListingMessage } from '@/types/listing';

interface ListingChatPanelProps {
  listingId: number;
  conversationId?: number;
  sellerId: number;
  onClose: () => void;
  open: boolean;
}

const MAX_MESSAGE_LENGTH = 2000;

function formatDaySeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

export function ListingChatPanel({
  listingId,
  conversationId,
  sellerId,
  onClose,
  open,
}: ListingChatPanelProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [activeConvId, setActiveConvId] = useState<number | undefined>(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Fetch conversations for this listing so we can resolve activeConvId after first message
  const { data: conversationsPage } = useQuery({
    queryKey: ['listing-conversations', listingId],
    queryFn: () => getMyConversations(0, 100),
    enabled: open,
    select: (page) => page.content.filter((c) => c.listingId === listingId),
  });

  // When conversations load and we don't have an activeConvId yet, pick the first match
  useEffect(() => {
    if (conversationsPage && conversationsPage.length > 0 && !activeConvId) {
      setActiveConvId(conversationsPage[0].id);
    }
  }, [conversationsPage, activeConvId]);

  // Fetch messages when conversation exists
  const { data: messagesPage, isLoading } = useQuery({
    queryKey: ['listing-messages', activeConvId],
    queryFn: () => getConversationMessages(activeConvId as number, 0, 50),
    enabled: activeConvId !== undefined,
  });

  const messages = messagesPage?.content ?? [];

  // Mark conversation as read
  useEffect(() => {
    if (activeConvId && open) {
      markConversationRead(activeConvId).catch(() => {
        // Silent fail for read receipts
      });
    }
  }, [activeConvId, open]);

  // Subscribe to real-time messages
  useStompSubscription(
    `/topic/listing-conversation/${activeConvId}`,
    useCallback(
      (msg) => {
        try {
          const newMessage = JSON.parse(msg.body) as ListingMessage;
          queryClient.setQueryData(
            ['listing-messages', activeConvId],
            (old: { content: ListingMessage[] } | undefined) => {
              if (!old) return old;
              return { ...old, content: [...old.content, newMessage] };
            },
          );
        } catch {
          // Ignore parse errors
        }
      },
      [activeConvId, queryClient],
    ),
    activeConvId !== undefined && open,
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isAtBottom]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setIsAtBottom(atBottom);
  }

  // Send first message (creates conversation)
  const sendFirstMut = useMutation({
    mutationFn: (text: string) => sendListingMessage(listingId, text),
    onSuccess: async () => {
      setContent('');
      // Refetch conversations to get the newly created conversation ID
      await queryClient.invalidateQueries({ queryKey: ['listing-conversations', listingId] });
      // The useEffect watching conversationsPage will set activeConvId automatically
    },
  });

  // Reply to existing conversation
  const replyMut = useMutation({
    mutationFn: (text: string) => replyToConversation(activeConvId as number, text),
    onSuccess: (msg) => {
      setContent('');
      queryClient.setQueryData(
        ['listing-messages', activeConvId],
        (old: { content: ListingMessage[] } | undefined) => {
          if (!old) return { content: [msg], totalPages: 1, totalElements: 1, number: 0, size: 50, first: true, last: true };
          return { ...old, content: [...old.content, msg] };
        },
      );
    },
  });

  function handleSend() {
    const text = content.trim();
    if (!text) return;

    if (activeConvId) {
      replyMut.mutate(text);
    } else {
      sendFirstMut.mutate(text);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isPending = sendFirstMut.isPending || replyMut.isPending;
  const isSeller = user?.id === sellerId;

  let lastDay = '';

  return (
    <Sheet open={open} onClose={onClose} title="Mensagens">
      <div className="flex flex-col h-[60vh] max-h-[500px]">
        {/* Messages area */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3"
        >
          {isLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton.Line className="h-8 w-3/4" />
              <Skeleton.Line className="h-8 w-1/2 ml-auto" />
              <Skeleton.Line className="h-8 w-2/3" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-10 w-10 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500">
                {isSeller
                  ? 'Sem mensagens ainda.'
                  : 'Envie uma mensagem ao vendedor para iniciar a conversa.'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              const msgDay = new Date(msg.sentAt).toDateString();
              const showDaySep = msgDay !== lastDay;
              lastDay = msgDay;

              return (
                <div key={msg.id}>
                  {showDaySep && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-neutral-200" />
                      <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">
                        {formatDaySeparator(msg.sentAt)}
                      </span>
                      <div className="flex-1 h-px bg-neutral-200" />
                    </div>
                  )}
                  <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-xl px-3 py-2',
                        isOwn
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-neutral-100 text-neutral-900 rounded-bl-sm',
                      )}
                    >
                      {!isOwn && (
                        <p className="text-[11px] font-medium text-neutral-500 mb-0.5">{msg.senderName}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <p
                        className={cn(
                          'text-[10px] mt-1',
                          isOwn ? 'text-white/70' : 'text-neutral-400',
                        )}
                      >
                        {formatMessageTime(msg.sentAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 pt-2 border-t border-neutral-100"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma mensagem..."
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
            className={cn(
              'flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            )}
          />
          <Button type="submit" size="sm" loading={isPending} disabled={!content.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {content.length > 0 && (
          <p className="text-[10px] text-neutral-400 text-right mt-1">
            {content.length}/{MAX_MESSAGE_LENGTH}
          </p>
        )}
      </div>
    </Sheet>
  );
}
