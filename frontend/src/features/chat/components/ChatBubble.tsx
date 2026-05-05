import type { ChatMessage } from '@/types/chat';
import { cn } from '@/utils/cn';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function ChatBubble({ message, isOwn, showAvatar }: ChatBubbleProps) {
  const time = new Date(message.sentAt).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <div className="flex-shrink-0 w-7">
          {showAvatar && (
            <div className="w-7 h-7 rounded-full bg-secondary-100 text-secondary-700 flex items-center justify-center text-[10px] font-semibold">
              {getInitials(message.senderName)}
            </div>
          )}
        </div>
      )}
      <div
        className={cn(
          'max-w-[75%] px-3.5 py-2',
          isOwn
            ? 'bg-primary-600 text-white rounded-2xl rounded-br-md'
            : 'bg-neutral-100 text-neutral-900 rounded-2xl rounded-bl-md',
        )}
      >
        {!isOwn && showAvatar && (
          <p className="text-xs font-medium mb-0.5 opacity-70">{message.senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1',
            isOwn ? 'text-white/60' : 'text-neutral-400',
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
