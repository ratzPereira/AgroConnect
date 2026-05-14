import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage } from '@/api/chat';
import { useAuthStore } from '@/stores/authStore';
import { useChatMessages } from '../hooks/useChatMessages';
import { ChatBubble } from './ChatBubble';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ChatPanelProps {
  readonly requestId: number;
}

function formatDaySeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
}

function isSameGroup(a: string, b: string, aSender: number, bSender: number): boolean {
  if (aSender !== bSender) return false;
  const diff = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return diff < 120_000;
}

export function ChatPanel({ requestId }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const { messages, isLoading } = useChatMessages(requestId);

  const sendMut = useMutation({
    mutationFn: () => sendMessage(requestId, { content }),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', requestId] });
    },
  });

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (content.trim()) sendMut.mutate();
    }
  }

  let lastDay = '';

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary-600" />
          <h2 className="font-semibold text-neutral-900 text-sm">Chat</h2>
        </div>
      </CardHeader>
      <CardBody>
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-96 overflow-y-auto mb-4 space-y-2 pr-1"
        >
          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
            </div>
          )}
          {!isLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-10 w-10 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500">Sem mensagens. Inicie a conversa.</p>
            </div>
          )}
          {!isLoading && messages.length > 0 && (
            messages.map((msg, i) => {
              const isOwn = msg.senderId === user?.id;
              const msgDay = new Date(msg.sentAt).toDateString();
              const showDaySep = msgDay !== lastDay;
              lastDay = msgDay;

              const prev = messages[i - 1];
              const showAvatar = !prev || !isSameGroup(prev.sentAt, msg.sentAt, prev.senderId, msg.senderId);

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
                  <ChatBubble message={msg} isOwn={isOwn} showAvatar={showAvatar} />
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {!isAtBottom && messages.length > 0 && (
          <button
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 text-xs bg-primary-600 text-white px-3 py-1 rounded-full shadow-md hover:bg-primary-700 transition-colors"
          >
            Nova mensagem ↓
          </button>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (content.trim()) sendMut.mutate();
          }}
          className="flex gap-2"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma mensagem..."
            maxLength={2000}
            rows={1}
            className={cn(
              'flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            )}
          />
          <Button type="submit" size="sm" loading={sendMut.isPending} disabled={!content.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
