import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListingChatPanel } from '../ListingChatPanel';
import type { ListingMessage } from '@/types/listing';

// JSDOM does not implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

/* ── Mock data ─────────────────────────────────────────── */

const TODAY = new Date().toISOString();

const mockMessages: ListingMessage[] = [
  {
    id: 1,
    senderId: 20,
    senderName: 'João Produtor',
    content: 'Olá, este artigo ainda está disponível?',
    sentAt: TODAY,
    readAt: null,
  },
  {
    id: 2,
    senderId: 10,
    senderName: 'Maria Santos',
    content: 'Sim, pode vir buscar!',
    sentAt: TODAY,
    readAt: null,
  },
];

/* ── Module-level control variables ────────────────────── */

let mockIsLoading = false;
let mockMessagesData: ListingMessage[] = [];
let mockConversationsData: { id: number; listingId: number }[] = [];
const mockSendFirstMutate = vi.fn();
const mockReplyMutate = vi.fn();
let mockSendFirstIsPending = false;
let mockReplyIsPending = false;

// Counter to distinguish between useMutation calls within a single render cycle.
// The component calls useMutation twice per render: first for sendFirst, second for reply.
let useMutationCallCounter = 0;

/* ── Mocks ─────────────────────────────────────────────── */

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
  useMutation: vi.fn(() => {
    useMutationCallCounter++;
    // Odd calls (1st, 3rd, ...) = sendFirst; Even calls (2nd, 4th, ...) = reply
    if (useMutationCallCounter % 2 === 1) {
      return { mutate: mockSendFirstMutate, isPending: mockSendFirstIsPending };
    }
    return { mutate: mockReplyMutate, isPending: mockReplyIsPending };
  }),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  })),
}));

vi.mock('@/components/ui/Sheet', () => ({
  Sheet: ({
    open,
    children,
    title,
  }: {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="sheet">
        {title && <h2>{title}</h2>}
        {children}
      </div>
    );
  },
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    disabled,
    loading,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
    <button disabled={disabled || loading} {...rest}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/Skeleton', () => {
  function Line({ className }: { className?: string }) {
    return <div data-testid="skeleton-line" className={className} />;
  }
  function SkeletonBase({ className }: { className?: string }) {
    return <div data-testid="skeleton" className={className} />;
  }
  return {
    Skeleton: Object.assign(SkeletonBase, { Line }),
  };
});

vi.mock('@/api/listings', () => ({
  sendListingMessage: vi.fn(),
  getConversationMessages: vi.fn(),
  getMyConversations: vi.fn(),
  replyToConversation: vi.fn(),
  markConversationRead: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 10, name: 'Maria Santos', email: 'maria@test.pt', role: 'CLIENT' as const },
  })),
}));

vi.mock('@/hooks/useStompClient', () => ({
  useStompSubscription: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Send: ({ className }: { className?: string }) => (
    <svg data-testid="send-icon" className={className} />
  ),
  MessageSquare: ({ className }: { className?: string }) => (
    <svg data-testid="message-square-icon" className={className} />
  ),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      className,
      role,
    }: Record<string, unknown>) => (
      <div className={className as string} role={role as string}>
        {children as React.ReactNode}
      </div>
    ),
  },
}));

/* ── Tests ──────────────────────────────────────────────── */

describe('ListingChatPanel — deeper coverage', () => {
  const defaultProps = {
    listingId: 1,
    conversationId: 5,
    sellerId: 6,
    onClose: vi.fn(),
    open: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useMutationCallCounter = 0;
    mockIsLoading = false;
    mockMessagesData = [];
    mockConversationsData = [{ id: 5, listingId: 1 }];
    mockSendFirstIsPending = false;
    mockReplyIsPending = false;
  });

  it('renders nothing visible when open=false (Sheet closed)', () => {
    const { container } = render(
      <ListingChatPanel {...defaultProps} open={false} />,
    );
    // Sheet mock returns null when open=false, so textarea should not exist
    expect(container.querySelector('textarea')).toBeNull();
  });

  it('shows empty state message for buyer (non-seller)', () => {
    mockMessagesData = [];
    render(<ListingChatPanel {...defaultProps} />);
    expect(
      screen.getByText('Envie uma mensagem ao vendedor para iniciar a conversa.'),
    ).toBeInTheDocument();
  });

  it('shows "Sem mensagens ainda." for seller', () => {
    // Set sellerId to match the auth user id (10)
    mockMessagesData = [];
    render(<ListingChatPanel {...defaultProps} sellerId={10} />);
    expect(screen.getByText('Sem mensagens ainda.')).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    mockIsLoading = true;
    render(<ListingChatPanel {...defaultProps} />);
    const skeletons = screen.getAllByTestId('skeleton-line');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders message input textarea with placeholder', () => {
    render(<ListingChatPanel {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Escreva uma mensagem...');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('send button is disabled when input is empty', () => {
    render(<ListingChatPanel {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders messages from data', () => {
    mockMessagesData = mockMessages;
    render(<ListingChatPanel {...defaultProps} />);
    expect(screen.getByText('Olá, este artigo ainda está disponível?')).toBeInTheDocument();
    expect(screen.getByText('Sim, pode vir buscar!')).toBeInTheDocument();
  });

  it('shows character count when typing', async () => {
    const user = userEvent.setup();
    render(<ListingChatPanel {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Escreva uma mensagem...');

    await user.type(textarea, 'Olá');
    expect(screen.getByText('3/2000')).toBeInTheDocument();
  });

  it('calls sendFirstMutate for first message (no active conversation)', async () => {
    const user = userEvent.setup();
    // No conversation ID means this is a first message
    mockConversationsData = [];
    render(
      <ListingChatPanel
        {...defaultProps}
        conversationId={undefined}
      />,
    );

    const textarea = screen.getByPlaceholderText('Escreva uma mensagem...');
    await user.type(textarea, 'Primeira mensagem');

    // Submit the form
    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    expect(mockSendFirstMutate).toHaveBeenCalledWith('Primeira mensagem');
  });

  it('shows sender name on incoming messages (not own)', () => {
    mockMessagesData = [mockMessages[0]]; // Message from senderId 20 (not 10)
    render(<ListingChatPanel {...defaultProps} />);
    expect(screen.getByText('João Produtor')).toBeInTheDocument();
  });
});
