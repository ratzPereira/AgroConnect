import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClientDashboard } from '../ClientDashboard';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [k: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

const mockDashboardData = {
  activeRequests: 5,
  totalProposals: 12,
  completedRequests: 3,
  totalSpent: 1450.5,
  recentRequests: [
    {
      id: 1,
      categoryName: 'Lavoura',
      status: 'PUBLISHED' as const,
      title: 'Lavoura de terreno',
      parish: 'Angra',
      municipality: 'Angra',
      island: 'Terceira',
      area: 2,
      areaUnit: 'ha',
      urgency: 'MEDIUM' as const,
      proposalCount: 0,
      createdAt: '2026-03-01T10:00:00Z',
    },
  ],
  recentNotifications: [
    {
      id: 1,
      type: 'NEW_PROPOSAL' as const,
      title: 'Nova proposta',
      body: 'Recebeu uma proposta',
      data: null,
      read: false,
      createdAt: '2026-03-20T10:00:00Z',
      link: '/requests/1',
    },
  ],
};

let mockIsLoading = false;
let mockData: typeof mockDashboardData | undefined = mockDashboardData;

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: mockData,
    isLoading: mockIsLoading,
  }),
}));

vi.mock('@/api/dashboard', () => ({
  getClientDashboardStats: vi.fn(),
}));

vi.mock('../DashboardStatCards', () => ({
  DashboardStatCards: ({ stats }: { stats: Array<{ label: string; value: number }> }) => (
    <div data-testid="dashboard-stat-cards">
      {stats.map((s) => (
        <span key={s.label}>{s.label}: {s.value}</span>
      ))}
    </div>
  ),
}));

vi.mock('../ActivityTimeline', () => ({
  ActivityTimeline: ({ notifications }: { notifications: unknown[] }) => (
    <div data-testid="activity-timeline">Timeline ({notifications.length})</div>
  ),
}));

vi.mock('../ActiveRequestCards', () => ({
  ActiveRequestCards: ({ requests }: { requests: unknown[] }) => (
    <div data-testid="active-request-cards">Cards ({requests.length})</div>
  ),
}));

vi.mock('../NextActionsPanel', () => ({
  NextActionsPanel: ({ requests }: { requests: unknown[] }) => (
    <div data-testid="next-actions-panel">Actions ({requests.length})</div>
  ),
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: Object.assign(
    () => <div data-testid="skeleton" />,
    {
      Stat: () => <div data-testid="skeleton-stat" />,
      Rect: ({ className }: { className?: string }) => <div data-testid="skeleton-rect" className={className} />,
    },
  ),
}));

vi.mock('lucide-react', () => ({
  FileText: (props: Record<string, unknown>) => <svg {...props} />,
  MessageSquare: (props: Record<string, unknown>) => <svg {...props} />,
  CheckCircle2: (props: Record<string, unknown>) => <svg {...props} />,
  DollarSign: (props: Record<string, unknown>) => <svg {...props} />,
}));

describe('ClientDashboard', () => {
  beforeEach(() => {
    mockIsLoading = false;
    mockData = mockDashboardData;
  });

  it('shows loading skeleton when loading', () => {
    mockIsLoading = true;
    mockData = undefined;
    render(<ClientDashboard />);
    expect(screen.getAllByTestId('skeleton-stat').length).toBe(4);
    expect(screen.getAllByTestId('skeleton-rect').length).toBeGreaterThan(0);
  });

  it('renders stat cards when data loaded', () => {
    render(<ClientDashboard />);
    expect(screen.getByTestId('dashboard-stat-cards')).toBeInTheDocument();
    expect(screen.getAllByText(/Pedidos Ativos/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Propostas/)).toBeInTheDocument();
    expect(screen.getByText(/Concluídos/)).toBeInTheDocument();
    expect(screen.getByText(/Total Gasto/)).toBeInTheDocument();
  });

  it('renders active requests section', () => {
    render(<ClientDashboard />);
    expect(screen.getAllByText('Pedidos Ativos').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('active-request-cards')).toBeInTheDocument();
    expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('next-actions-panel')).toBeInTheDocument();
  });
});
