import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Notifications } from '../Notifications';
import { format } from 'date-fns';
import type { ReactNode } from 'react';

/* ── Mocks ───────────────────────────────────────────────── */

const mockNavigate = vi.fn();
const mockMarkAsRead = vi.fn(() => Promise.resolve());
const mockMarkAllAsRead = vi.fn(() => Promise.resolve());
const mockGetMyNotifications = vi.fn();
const mockResetUnread = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/notifications', () => ({
  getMyNotifications: (...args: unknown[]) => mockGetMyNotifications(...args),
  markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
  markAllAsRead: (...args: unknown[]) => mockMarkAllAsRead(...args),
}));

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: vi.fn(() => ({
    resetUnread: mockResetUnread,
  })),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { variants: _v, initial: _i, animate: _a, ...rest } = props;
      return <div {...rest}>{children as ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

vi.mock('@/hooks/useMotionConfig', () => ({
  useMotionConfig: () => ({
    listContainerVariants: {},
    listItemVariants: {},
  }),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: Object.assign(
    () => <div data-testid="skeleton" />,
    {
      Card: () => <div data-testid="skeleton-card" />,
      Line: () => <div data-testid="skeleton-line" />,
      Circle: () => <div data-testid="skeleton-circle" />,
      Rect: () => <div data-testid="skeleton-rect" />,
    },
  ),
}));

vi.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title, description }: { title: string; description?: string }) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      {description && <span>{description}</span>}
    </div>
  ),
}));

vi.mock('@/components/illustrations/EmptyNotifications', () => ({
  EmptyNotifications: () => <div data-testid="empty-notifications-illustration" />,
}));

/* ── Helpers ─────────────────────────────────────────────── */

function emptyPage() {
  return {
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 20,
    first: true,
    last: true,
  };
}

function pageWithNotifications() {
  return {
    content: [
      {
        id: 1,
        type: 'NEW_PROPOSAL',
        title: 'Nova proposta recebida',
        body: 'Recebeu uma proposta para o pedido de lavoura.',
        read: false,
        link: '/requests/5',
        data: null,
        createdAt: '2026-03-28T10:30:00Z',
      },
      {
        id: 2,
        type: 'EXECUTION_COMPLETED',
        title: 'Servico concluido',
        body: 'O servico foi marcado como concluido pelo prestador.',
        read: true,
        link: '/requests/3',
        data: null,
        createdAt: '2026-03-27T14:15:00Z',
      },
      {
        id: 3,
        type: 'NEW_MESSAGE',
        title: 'Nova mensagem',
        body: 'Tem uma nova mensagem de Carlos.',
        read: false,
        link: null,
        data: null,
        createdAt: '2026-03-26T09:00:00Z',
      },
    ],
    totalPages: 1,
    totalElements: 3,
    number: 0,
    size: 20,
    first: true,
    last: true,
  };
}

/* ── Tests ───────────────────────────────────────────────── */

describe('Notifications — deeper2 coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title "Notificações"', () => {
    mockGetMyNotifications.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Notifications />, { route: '/notifications' });
    expect(screen.getByText('Notificações')).toBeInTheDocument();
  });

  it('renders "Marcar todas como lidas" button', () => {
    mockGetMyNotifications.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Notifications />, { route: '/notifications' });
    expect(screen.getByText('Marcar todas como lidas')).toBeInTheDocument();
  });

  it('shows loading skeleton cards while loading', () => {
    mockGetMyNotifications.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Notifications />, { route: '/notifications' });
    const skeletonCards = screen.getAllByTestId('skeleton-card');
    expect(skeletonCards.length).toBe(5);
  });

  it('shows empty state "Tudo em dia!" when no notifications', async () => {
    mockGetMyNotifications.mockResolvedValue(emptyPage());
    renderWithProviders(<Notifications />, { route: '/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Tudo em dia!')).toBeInTheDocument();
    });
  });

  it('renders notification titles', async () => {
    mockGetMyNotifications.mockResolvedValue(pageWithNotifications());
    renderWithProviders(<Notifications />, { route: '/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Nova proposta recebida')).toBeInTheDocument();
    });
    expect(screen.getByText('Servico concluido')).toBeInTheDocument();
    expect(screen.getByText('Nova mensagem')).toBeInTheDocument();
  });

  it('renders notification body text', async () => {
    mockGetMyNotifications.mockResolvedValue(pageWithNotifications());
    renderWithProviders(<Notifications />, { route: '/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Recebeu uma proposta para o pedido de lavoura.')).toBeInTheDocument();
    });
    expect(screen.getByText('O servico foi marcado como concluido pelo prestador.')).toBeInTheDocument();
    expect(screen.getByText('Tem uma nova mensagem de Carlos.')).toBeInTheDocument();
  });

  it('renders notification dates', async () => {
    mockGetMyNotifications.mockResolvedValue(pageWithNotifications());
    renderWithProviders(<Notifications />, { route: '/notifications' });

    // date-fns format renders in local timezone, so compute expected strings the same way
    const expected1 = format(new Date('2026-03-28T10:30:00Z'), 'dd/MM/yyyy HH:mm');
    const expected2 = format(new Date('2026-03-27T14:15:00Z'), 'dd/MM/yyyy HH:mm');
    const expected3 = format(new Date('2026-03-26T09:00:00Z'), 'dd/MM/yyyy HH:mm');

    await waitFor(() => {
      expect(screen.getByText(expected1)).toBeInTheDocument();
    });
    expect(screen.getByText(expected2)).toBeInTheDocument();
    expect(screen.getByText(expected3)).toBeInTheDocument();
  });

  it('shows unread indicator (blue dot) for unread notifications', async () => {
    mockGetMyNotifications.mockResolvedValue(pageWithNotifications());
    renderWithProviders(<Notifications />, { route: '/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Nova proposta recebida')).toBeInTheDocument();
    });
    // Unread notifications have a span with specific classes (blue dot)
    const unreadDots = document.querySelectorAll('.bg-primary-500');
    // Two unread: id 1 and id 3
    expect(unreadDots.length).toBe(2);
  });

  it('calls markAllAsRead on "Marcar todas como lidas" button click', async () => {
    const user = userEvent.setup();
    mockGetMyNotifications.mockResolvedValue(pageWithNotifications());
    renderWithProviders(<Notifications />, { route: '/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Nova proposta recebida')).toBeInTheDocument();
    });

    const markAllButton = screen.getByText('Marcar todas como lidas');
    await user.click(markAllButton);

    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('navigates on notification click when link is present', async () => {
    const user = userEvent.setup();
    mockGetMyNotifications.mockResolvedValue(pageWithNotifications());
    renderWithProviders(<Notifications />, { route: '/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Nova proposta recebida')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nova proposta recebida'));
    expect(mockMarkAsRead).toHaveBeenCalledWith(1);
    expect(mockNavigate).toHaveBeenCalledWith('/requests/5');
  });

  it('does not navigate when notification has no link', async () => {
    const user = userEvent.setup();
    mockGetMyNotifications.mockResolvedValue(pageWithNotifications());
    renderWithProviders(<Notifications />, { route: '/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Nova mensagem')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Nova mensagem'));
    // Should mark as read (unread) but NOT navigate (no link)
    expect(mockMarkAsRead).toHaveBeenCalledWith(3);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
