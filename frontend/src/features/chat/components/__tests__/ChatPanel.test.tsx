import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatPanel } from '../ChatPanel';

// JSDOM does not implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const mockMessages = [
  { id: 1, senderId: 10, senderName: 'Maria Santos', content: 'Olá!', sentAt: '2026-03-15T14:30:00Z' },
  { id: 2, senderId: 6, senderName: 'António Mendes', content: 'Bom dia!', sentAt: '2026-03-15T14:31:00Z' },
];

let mockIsLoading = false;
let mockReturnMessages = mockMessages;

vi.mock('../../hooks/useChatMessages', () => ({
  useChatMessages: vi.fn(() => ({
    messages: mockReturnMessages,
    isLoading: mockIsLoading,
  })),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 10, name: 'Maria Santos', email: 'maria@test.pt', role: 'CLIENT' },
  })),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

vi.mock('@/api/chat', () => ({
  sendMessage: vi.fn(),
}));

describe('ChatPanel', () => {
  beforeEach(() => {
    mockIsLoading = false;
    mockReturnMessages = mockMessages;
  });

  it('renders chat container with header', () => {
    render(<ChatPanel requestId={1} />);
    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('renders message input area', () => {
    render(<ChatPanel requestId={1} />);
    const textarea = screen.getByPlaceholderText('Escreva uma mensagem...');
    expect(textarea).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockIsLoading = true;
    mockReturnMessages = [];
    render(<ChatPanel requestId={1} />);
    // Loader2 spinner is rendered during loading
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });

  it('shows empty state when no messages', () => {
    mockReturnMessages = [];
    render(<ChatPanel requestId={1} />);
    expect(screen.getByText('Sem mensagens. Inicie a conversa.')).toBeInTheDocument();
  });

  it('renders messages when loaded', () => {
    render(<ChatPanel requestId={1} />);
    expect(screen.getByText('Olá!')).toBeInTheDocument();
    expect(screen.getByText('Bom dia!')).toBeInTheDocument();
  });
});
