import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListingChatPanel } from '../ListingChatPanel';

// JSDOM does not implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const mockMessages = [
  { id: 1, senderId: 10, senderName: 'Maria Santos', content: 'Este produto ainda está disponível?', sentAt: '2026-03-15T14:30:00Z', readAt: null },
  { id: 2, senderId: 6, senderName: 'António Mendes', content: 'Sim, está disponível!', sentAt: '2026-03-15T14:35:00Z', readAt: null },
];

let mockIsLoading = false;
let mockMessagesData = mockMessages;
let mockConversationsData: { id: number; listingId: number }[] = [];

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((opts: { queryKey: string[] }) => {
    if (opts.queryKey[0] === 'listing-messages') {
      return { data: { content: mockMessagesData }, isLoading: mockIsLoading };
    }
    if (opts.queryKey[0] === 'listing-conversations') {
      return { data: mockConversationsData, isLoading: false };
    }
    return { data: undefined, isLoading: false };
  }),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  })),
}));

vi.mock('@/api/listings', () => ({
  sendListingMessage: vi.fn(),
  getConversationMessages: vi.fn(),
  getMyConversations: vi.fn(),
  replyToConversation: vi.fn(),
  markConversationRead: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 10, name: 'Maria Santos', email: 'maria@test.pt', role: 'CLIENT' },
  })),
}));

vi.mock('@/hooks/useStompClient', () => ({
  useStompSubscription: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className, role }: Record<string, unknown>) => (
      <div className={className as string} role={role as string}>{children as React.ReactNode}</div>
    ),
  },
}));

describe('ListingChatPanel', () => {
  const defaultProps = {
    listingId: 1,
    conversationId: 5,
    sellerId: 6,
    onClose: vi.fn(),
    open: true,
  };

  beforeEach(() => {
    mockIsLoading = false;
    mockMessagesData = mockMessages;
    mockConversationsData = [{ id: 5, listingId: 1 }];
  });

  it('renders chat container (Sheet with title)', () => {
    render(<ListingChatPanel {...defaultProps} />);
    expect(screen.getByText('Mensagens')).toBeInTheDocument();
  });

  it('renders message input area', () => {
    render(<ListingChatPanel {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Escreva uma mensagem...');
    expect(textarea).toBeInTheDocument();
  });

  it('shows messages when loaded', () => {
    render(<ListingChatPanel {...defaultProps} />);
    expect(screen.getByText('Este produto ainda está disponível?')).toBeInTheDocument();
    expect(screen.getByText('Sim, está disponível!')).toBeInTheDocument();
  });

  it('shows empty state when no messages and not seller', () => {
    mockMessagesData = [];
    render(<ListingChatPanel {...defaultProps} />);
    expect(screen.getByText(/Envie uma mensagem ao vendedor/)).toBeInTheDocument();
  });
});
