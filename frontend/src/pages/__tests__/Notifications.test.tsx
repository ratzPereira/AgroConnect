import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Notifications } from '../Notifications';

vi.mock('@/api/notifications', () => ({
  getMyNotifications: vi.fn(() =>
    Promise.resolve({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 20,
      first: true,
      last: true,
    }),
  ),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
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

describe('Notifications', () => {
  it('renders notifications page title', async () => {
    renderWithProviders(<Notifications />, { route: '/notifications' });
    expect(screen.getByText('Notificações')).toBeInTheDocument();
  });

  it('renders mark all as read button', () => {
    renderWithProviders(<Notifications />, { route: '/notifications' });
    expect(screen.getByText('Marcar todas como lidas')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', async () => {
    renderWithProviders(<Notifications />, { route: '/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Tudo em dia!')).toBeInTheDocument();
    });
  });
});
