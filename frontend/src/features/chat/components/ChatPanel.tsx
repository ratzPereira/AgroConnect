import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendMessage } from '@/api/chat';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ChatMessage } from '@/types/chat';

interface ChatPanelProps {
  requestId: number;
}

export function ChatPanel({ requestId }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['chat', requestId],
    queryFn: () => getMessages(requestId),
    refetchInterval: 5000,
  });

  const sendMut = useMutation({
    mutationFn: () => sendMessage(requestId, { content }),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['chat', requestId] });
    },
  });

  const messages = data?.content ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="font-semibold text-neutral-900 text-sm">Chat</h2>
      </CardHeader>
      <CardBody>
        <div className="h-64 overflow-y-auto mb-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-neutral-400" /></div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-6">Sem mensagens. Inicie a conversa.</p>
          ) : (
            messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (content.trim()) sendMut.mutate(); }}
          className="flex gap-2"
        >
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva uma mensagem..."
            maxLength={2000}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <Button type="submit" size="sm" loading={sendMut.isPending} disabled={!content.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function ChatBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[75%] rounded-xl px-4 py-2',
        isOwn ? 'bg-green-600 text-white' : 'bg-neutral-100 text-neutral-900',
      )}>
        {!isOwn && <p className="text-xs font-medium mb-0.5 opacity-70">{message.senderName}</p>}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={cn('text-xs mt-1', isOwn ? 'text-green-200' : 'text-neutral-400')}>
          {new Date(message.sentAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
