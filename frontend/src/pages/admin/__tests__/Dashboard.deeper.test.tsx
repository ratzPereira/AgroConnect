import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';

/* ── Mocks ───────────────────────────────────────────────── */

const mockNavigate = vi.fn();
const mockGetAdminDashboard = vi.fn();
const mockGetAdminAnalytics = vi.fn();
const mockListDisputes = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/admin', () => ({
  getAdminDashboard: (...args: unknown[]) => mockGetAdminDashboard(...args),
  getAdminAnalytics: (...args: unknown[]) => mockGetAdminAnalytics(...args),
  listDisputes: (...args: unknown[]) => mockListDisputes(...args),
}));

vi.mock('@/api/requests', () => ({
  resolveDispute: vi.fn(() => Promise.resolve({})),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// recharts: passthrough so charts don't need a real layout in jsdom
vi.mock('recharts', () => {
  const C = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: C, AreaChart: C, Area: C, BarChart: C, Bar: C,
    PieChart: C, Pie: C, Cell: C, CartesianGrid: C, XAxis: C, YAxis: C,
    Tooltip: C, Legend: C,
  };
});

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/dashboard/components/DashboardStatCards', () => ({
  DashboardStatCards: ({ stats }: { stats: Array<{ label: string; value: number; prefix?: string; decimals?: number }> }) => (
    <div data-testid="stat-cards">
      {stats.map((s) => (
        <div key={s.label} data-testid={`stat-${s.label}`}>
          <span data-testid="stat-label">{s.label}</span>
          <span data-testid="stat-value">{s.prefix ?? ''}{typeof s.decimals === 'number' ? s.value.toFixed(s.decimals) : s.value}</span>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: Object.assign(
    ({ children, ...props }: Record<string, unknown>) => <div data-testid="skeleton" {...props}>{children as React.ReactNode}</div>,
    {
      Stat: () => <div data-testid="skeleton-stat" />,
      Table: () => <div data-testid="skeleton-table" />,
      Card: () => <div data-testid="skeleton-card" />,
    },
  ),
}));

/* ── Test data ───────────────────────────────────────────── */

const dashboardData = {
  totalUsers: 150, totalClients: 100, totalProviders: 50, totalRequests: 42,
  activeRequests: 10, totalVolume: 12500.5, totalCommissions: 625.0,
  pendingDisputes: 2, avgPlatformRating: 4.3, totalListings: 30, activeListings: 20, soldListings: 8,
};

const analyticsData = {
  usersByRole: [{ label: 'CLIENT', count: 100 }, { label: 'PROVIDER_MANAGER', count: 50 }],
  requestsByStatus: [{ label: 'PUBLISHED', count: 3 }, { label: 'DISPUTED', count: 2 }],
  registrationsDaily: [{ date: '2026-06-01', count: 1 }, { date: '2026-06-02', count: 2 }],
  requestsDaily: [{ date: '2026-06-01', count: 2 }, { date: '2026-06-02', count: 3 }],
  revenueDaily: [{ date: '2026-06-01', amount: 100, commission: 12 }, { date: '2026-06-02', amount: 200, commission: 24 }],
};

const disputesData = {
  content: [
    { requestId: 101, clientName: 'Maria Santos', providerName: 'AgroTech Lda', requestTitle: 'Lavoura de terreno', amount: 250.75, createdAt: '2026-03-15T10:30:00Z' },
    { requestId: 202, clientName: 'Ana Costa', providerName: 'Verde Campo', requestTitle: 'Poda de fruteiras', amount: 180.0, createdAt: '2026-03-20T14:00:00Z' },
  ],
  totalPages: 1, totalElements: 2, number: 0, size: 20, first: true, last: true,
};

const emptyDisputesData = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20, first: true, last: true };

/* ── Tests ───────────────────────────────────────────────── */

describe('AdminDashboard — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminAnalytics.mockResolvedValue(analyticsData);
  });

  it('renders loading state with title and skeletons', async () => {
    mockGetAdminDashboard.mockReturnValue(new Promise(() => {}));
    mockListDisputes.mockReturnValue(new Promise(() => {}));

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    expect(screen.getByText('Administração')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton-stat')).toHaveLength(4);
    expect(screen.getByTestId('skeleton-table')).toBeInTheDocument();
  });

  it('renders stat cards with values and labels after loading', async () => {
    mockGetAdminDashboard.mockResolvedValue(dashboardData);
    mockListDisputes.mockResolvedValue(emptyDisputesData);

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    await waitFor(() => expect(screen.getByTestId('stat-cards')).toBeInTheDocument());
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Utilizadores')).toBeInTheDocument();
    expect(screen.getByTestId('stat-Disputas pendentes')).toBeInTheDocument();
  });

  it('shows empty disputes message when there are none', async () => {
    mockGetAdminDashboard.mockResolvedValue(dashboardData);
    mockListDisputes.mockResolvedValue(emptyDisputesData);

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    await waitFor(() => expect(screen.getByText(/Sem disputas pendentes/i)).toBeInTheDocument());
  });

  it('lists disputes with title and amount', async () => {
    mockGetAdminDashboard.mockResolvedValue(dashboardData);
    mockListDisputes.mockResolvedValue(disputesData);

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    await waitFor(() => expect(screen.getByText('Lavoura de terreno')).toBeInTheDocument());
    expect(screen.getByText('Poda de fruteiras')).toBeInTheDocument();
    expect(screen.getByText('€250.75')).toBeInTheDocument();
  });

  it('navigates to the request when a dispute title is clicked', async () => {
    mockGetAdminDashboard.mockResolvedValue(dashboardData);
    mockListDisputes.mockResolvedValue(disputesData);

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    await waitFor(() => expect(screen.getByText('Lavoura de terreno')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Lavoura de terreno'));
    expect(mockNavigate).toHaveBeenCalledWith('/requests/101');
  });

  it('opens the resolve modal when "Resolver" is clicked', async () => {
    mockGetAdminDashboard.mockResolvedValue(dashboardData);
    mockListDisputes.mockResolvedValue(disputesData);

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    await waitFor(() => expect(screen.getByText('Lavoura de terreno')).toBeInTheDocument());
    const resolveButtons = screen.getAllByRole('button', { name: /Resolver/i });
    fireEvent.click(resolveButtons[0]);

    await waitFor(() => expect(screen.getByText('Resolver disputa')).toBeInTheDocument());
  });
});
