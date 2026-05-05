import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const mockNavigate = vi.fn();
const mockResetUnread = vi.fn();
const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();

let mockUnreadCount = 0;

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: null })),
  useMutation: vi.fn(() => ({ mutate: mockMutate })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: mockInvalidateQueries })),
}));

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: vi.fn(() => ({
    unreadCount: mockUnreadCount,
    resetUnread: mockResetUnread,
  })),
}));

vi.mock('@/api/notifications', () => ({
  getMyNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}));

vi.mock('date-fns', () => ({
  format: vi.fn(() => '01/01/2026 10:00'),
}));

vi.mock('@/utils/cn', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('lucide-react', () => ({
  Bell: (props: Record<string, unknown>) => <svg data-testid="bell-icon" {...props} />,
}));

import { NotificationBell } from '../NotificationBell';

describe('NotificationBell', () => {
  beforeEach(() => {
    mockUnreadCount = 0;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders bell icon', () => {
    render(<NotificationBell />);
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
  });

  it('shows unread count badge when count > 0', async () => {
    mockUnreadCount = 5;
    const { useNotificationStore } = await import('@/stores/notificationStore');
    vi.mocked(useNotificationStore).mockReturnValue({
      unreadCount: 5,
      resetUnread: mockResetUnread,
    });

    render(<NotificationBell />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('hides badge when count is 0', () => {
    mockUnreadCount = 0;
    render(<NotificationBell />);
    const badge = screen.queryByText('0');
    expect(badge).toBeNull();
  });

  it('opens dropdown on click', () => {
    render(<NotificationBell />);
    const button = screen.getByRole('button', { name: /notificações/i });

    expect(screen.queryByText('Sem notificações.')).toBeNull();
    fireEvent.click(button);
    expect(screen.getByText('Sem notificações.')).toBeInTheDocument();
  });

  it('shows 99+ when count exceeds 99', async () => {
    const { useNotificationStore } = await import('@/stores/notificationStore');
    vi.mocked(useNotificationStore).mockReturnValue({
      unreadCount: 150,
      resetUnread: mockResetUnread,
    });

    render(<NotificationBell />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('navigates to /notifications when "Ver todas" is clicked', () => {
    render(<NotificationBell />);
    const bellButton = screen.getByRole('button', { name: /notificações/i });
    fireEvent.click(bellButton);

    const viewAllButton = screen.getByText('Ver todas as notificações');
    fireEvent.click(viewAllButton);
    expect(mockNavigate).toHaveBeenCalledWith('/notifications');
  });
});
