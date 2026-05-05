import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityTimeline } from '../ActivityTimeline';
import type { Notification } from '@/types/notification';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [k: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}));

vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'há 2 dias',
}));

vi.mock('date-fns/locale/pt', () => ({ pt: {} }));

vi.mock('lucide-react', () => ({
  Bell: (props: Record<string, unknown>) => <svg data-testid="bell-icon" {...props} />,
}));

const makeNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 1,
  type: 'NEW_PROPOSAL',
  title: 'Nova proposta recebida',
  body: 'Recebeu uma proposta para Lavoura de terreno',
  data: null,
  read: false,
  createdAt: '2026-03-20T10:00:00Z',
  link: '/requests/1',
  ...overrides,
});

const mockNotifications: Notification[] = [
  makeNotification({ id: 1, title: 'Nova proposta recebida', body: 'Proposta para Lavoura', read: false }),
  makeNotification({ id: 2, title: 'Serviço concluído', body: 'Limpeza foi concluída', read: true, link: '/requests/2' }),
  makeNotification({ id: 3, title: 'Nova mensagem', body: 'Mensagem do prestador', read: false, link: null }),
];

describe('ActivityTimeline', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows empty state when no notifications', () => {
    render(<ActivityTimeline notifications={[]} />);
    expect(screen.getByText('Sem atividade recente')).toBeInTheDocument();
  });

  it('renders heading "Atividade recente"', () => {
    render(<ActivityTimeline notifications={mockNotifications} />);
    expect(screen.getByText('Atividade recente')).toBeInTheDocument();
  });

  it('renders notification titles and bodies', () => {
    render(<ActivityTimeline notifications={mockNotifications} />);
    expect(screen.getByText('Nova proposta recebida')).toBeInTheDocument();
    expect(screen.getByText('Serviço concluído')).toBeInTheDocument();
    expect(screen.getByText('Nova mensagem')).toBeInTheDocument();
    expect(screen.getByText('Proposta para Lavoura')).toBeInTheDocument();
    expect(screen.getByText('Limpeza foi concluída')).toBeInTheDocument();
    expect(screen.getByText('Mensagem do prestador')).toBeInTheDocument();
  });

  it('highlights unread notifications with distinct background', () => {
    const { container } = render(<ActivityTimeline notifications={mockNotifications} />);
    const items = container.querySelectorAll('.bg-primary-50\\/50');
    // Two unread notifications (id 1 and 3)
    expect(items.length).toBe(2);
  });

  it('navigates when clicking a notification with a link', () => {
    render(<ActivityTimeline notifications={mockNotifications} />);
    const completedNotif = screen.getByText('Serviço concluído').closest('[class*="cursor-pointer"]');
    expect(completedNotif).toBeTruthy();
    fireEvent.click(completedNotif!);
    expect(mockNavigate).toHaveBeenCalledWith('/requests/2');
  });

  it('renders "Ver tudo" link pointing to /notifications', () => {
    render(<ActivityTimeline notifications={mockNotifications} />);
    const link = screen.getByText('Ver tudo');
    expect(link.closest('a')).toHaveAttribute('href', '/notifications');
  });
});
