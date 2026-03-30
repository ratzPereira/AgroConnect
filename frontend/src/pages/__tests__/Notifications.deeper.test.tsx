import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Notifications } from '../Notifications';

/* ── Mocks ───────────────────────────────────────────────── */

const mockNavigate = vi.fn();
const mockMarkAsRead = vi.fn(() => Promise.resolve());
const mockMarkAllAsRead = vi.fn(() => Promise.resolve());
const mockGetMyNotifications = vi.fn();

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
    resetUnread: vi.fn(),
  })),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { variants: _v, initial: _i, animate: _a, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

vi.mock('@/hooks/useMotionConfig', () => ({
  useMotionConfig: () => ({
    listContainerVariants: {},
    listItemVariants: {},
  }),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

/* ── Tests ───────────────────────────────────────────────── */

describe('Notifications — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notifications list with multiple items', async () => {
    mockGetMyNotifications.mockResolvedValue({
      content: [
        {
          id: 1,
          title: 'Nova proposta',
          body: 'Recebeu uma nova proposta para o pedido de lavoura.',
          read: false,
          link: '/requests/5',
          createdAt: '2026-03-28T10:00:00Z',
        },
        {
          id: 2,
          title: 'Serviço concluído',
          body: 'O serviço foi marcado como concluído.',
          read: true,
          link: '/requests/3',
          createdAt: '2026-03-27T14:30:00Z',
        },
      ],
      totalPages: 1,
      totalElements: 2,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<Notifications />, { route: '/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Nova proposta')).toBeInTheDocument();
    });
    expect(screen.getByText('Serviço concluído')).toBeInTheDocument();
    expect(screen.getByText(/Recebeu uma nova proposta/)).toBeInTheDocument();
  });

  it('marks notification as read and navigates when clicked', async () => {
    const user = userEvent.setup();
    mockGetMyNotifications.mockResolvedValue({
      content: [
        {
          id: 10,
          title: 'Aviso importante',
          body: 'Mensagem do sistema.',
          read: false,
          link: '/requests/7',
          createdAt: '2026-03-28T08:00:00Z',
        },
      ],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<Notifications />, { route: '/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Aviso importante')).toBeInTheDocument();
    });

    // Click the notification card
    await user.click(screen.getByText('Aviso importante'));
    expect(mockMarkAsRead).toHaveBeenCalledWith(10);
    expect(mockNavigate).toHaveBeenCalledWith('/requests/7');
  });

  it('shows pagination when multiple pages exist', async () => {
    mockGetMyNotifications.mockResolvedValue({
      content: [
        {
          id: 1,
          title: 'Notificação 1',
          body: 'Body 1',
          read: true,
          link: null,
          createdAt: '2026-03-28T10:00:00Z',
        },
      ],
      totalPages: 3,
      totalElements: 50,
      number: 0,
      size: 20,
      first: true,
      last: false,
    });

    renderWithProviders(<Notifications />, { route: '/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Notificação 1')).toBeInTheDocument();
    });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText('Anterior')).toBeInTheDocument();
    expect(screen.getByText('Seguinte')).toBeInTheDocument();
  });

  it('does not mark already-read notification as read on click', async () => {
    const user = userEvent.setup();
    mockGetMyNotifications.mockResolvedValue({
      content: [
        {
          id: 20,
          title: 'Already read',
          body: 'This one was read.',
          read: true,
          link: '/requests/2',
          createdAt: '2026-03-28T06:00:00Z',
        },
      ],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<Notifications />, { route: '/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Already read')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Already read'));
    // Should navigate but NOT mark as read (already read)
    expect(mockMarkAsRead).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/requests/2');
  });
});
