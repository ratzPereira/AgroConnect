import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatBubble } from '../ChatBubble';
import type { ChatMessage } from '@/types/chat';

const baseMessage: ChatMessage = {
  id: 1,
  senderId: 10,
  senderName: 'Maria Santos',
  content: 'Olá, bom dia!',
  sentAt: '2026-03-15T14:30:00Z',
};

describe('ChatBubble', () => {
  it('renders message content', () => {
    render(<ChatBubble message={baseMessage} isOwn={false} showAvatar={true} />);
    expect(screen.getByText('Olá, bom dia!')).toBeInTheDocument();
  });

  it('shows timestamp', () => {
    render(<ChatBubble message={baseMessage} isOwn={false} showAvatar={true} />);
    // The time is formatted with pt-PT locale as HH:MM
    const timeElement = document.querySelector('.text-\\[10px\\]');
    expect(timeElement).not.toBeNull();
    expect(timeElement?.textContent).toBeTruthy();
  });

  it('applies own message styling (right-aligned, primary color)', () => {
    const { container } = render(
      <ChatBubble message={baseMessage} isOwn={true} showAvatar={true} />,
    );
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv.className).toContain('justify-end');

    const bubble = container.querySelector('.bg-primary-600') as HTMLElement;
    expect(bubble).not.toBeNull();
    expect(bubble.className).toContain('text-white');
  });

  it('applies other message styling (left-aligned, neutral color)', () => {
    const { container } = render(
      <ChatBubble message={baseMessage} isOwn={false} showAvatar={true} />,
    );
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv.className).toContain('justify-start');

    const bubble = container.querySelector('.bg-neutral-100') as HTMLElement;
    expect(bubble).not.toBeNull();
    expect(bubble.className).toContain('text-neutral-900');
  });

  it('shows sender name and avatar when showAvatar is true and not own message', () => {
    render(<ChatBubble message={baseMessage} isOwn={false} showAvatar={true} />);
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    // Initials should be shown
    expect(screen.getByText('MS')).toBeInTheDocument();
  });

  it('does not show avatar when showAvatar is false', () => {
    render(<ChatBubble message={baseMessage} isOwn={false} showAvatar={false} />);
    expect(screen.queryByText('MS')).not.toBeInTheDocument();
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
  });

  it('does not show avatar or sender name for own messages', () => {
    render(<ChatBubble message={baseMessage} isOwn={true} showAvatar={true} />);
    expect(screen.queryByText('MS')).not.toBeInTheDocument();
    // Sender name is only shown for non-own messages with showAvatar
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
  });
});
