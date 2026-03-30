import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';

/* ── Mocks ───────────────────────────────────────────────── */

const mockNavigate = vi.fn();
const mockGetAdminDashboard = vi.fn();
const mockListDisputes = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/admin', () => ({
  getAdminDashboard: (...args: unknown[]) => mockGetAdminDashboard(...args),
  listDisputes: (...args: unknown[]) => mockListDisputes(...args),
}));

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

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data, columns, emptyTitle, onRowClick, loading }: {
    data: Array<Record<string, unknown>>;
    columns: Array<{ key: string; header: string; render: (row: Record<string, unknown>) => React.ReactNode }>;
    emptyTitle?: string;
    emptyDescription?: string;
    onRowClick?: (row: Record<string, unknown>) => void;
    loading?: boolean;
    keyExtractor?: (row: Record<string, unknown>) => string | number;
  }) => {
    if (loading) return <div data-testid="data-table-loading">Loading...</div>;
    if (data.length === 0) return <div data-testid="data-table-empty">{emptyTitle}</div>;
    return (
      <div data-testid="data-table">
        <div data-testid="table-headers">
          {columns.map((c) => (
            <span key={c.key} data-testid={`header-${c.key}`}>{c.header}</span>
          ))}
        </div>
        {data.map((d, i) => (
          <div
            key={i}
            data-testid="table-row"
            onClick={() => onRowClick?.(d)}
          >
            {columns.map((c) => (
              <span key={c.key} data-testid={`cell-${c.key}`}>{c.render(d)}</span>
            ))}
          </div>
        ))}
      </div>
    );
  },
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
  totalUsers: 150,
  totalClients: 100,
  totalProviders: 50,
  totalRequests: 42,
  activeRequests: 10,
  totalVolume: 12500.5,
  totalCommissions: 625.0,
  pendingDisputes: 2,
  avgPlatformRating: 4.3,
};

const disputesData = {
  content: [
    {
      requestId: 101,
      clientName: 'Maria Santos',
      providerName: 'AgroTech Lda',
      requestTitle: 'Lavoura de terreno',
      amount: 250.75,
      createdAt: '2026-03-15T10:30:00Z',
    },
    {
      requestId: 202,
      clientName: 'Ana Costa',
      providerName: 'Verde Campo',
      requestTitle: 'Poda de fruteiras',
      amount: 180.0,
      createdAt: '2026-03-20T14:00:00Z',
    },
  ],
  totalPages: 1,
  totalElements: 2,
  number: 0,
  size: 20,
  first: true,
  last: true,
};

const emptyDisputesData = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  number: 0,
  size: 20,
  first: true,
  last: true,
};

/* ── Tests ───────────────────────────────────────────────── */

describe('AdminDashboard — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state with title and skeletons', async () => {
    // Never resolve so loading stays true
    mockGetAdminDashboard.mockReturnValue(new Promise(() => {}));
    mockListDisputes.mockReturnValue(new Promise(() => {}));

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    expect(screen.getByText('Administração')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton-stat')).toHaveLength(4);
    expect(screen.getByTestId('skeleton-table')).toBeInTheDocument();
  });

  it('renders stat cards with correct values after loading', async () => {
    mockGetAdminDashboard.mockResolvedValue(dashboardData);
    mockListDisputes.mockResolvedValue(emptyDisputesData);

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    await waitFor(() => {
      expect(screen.getByTestId('stat-cards')).toBeInTheDocument();
    });

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders stat card labels: Utilizadores, Pedidos, Volume total, Rating medio', async () => {
    mockGetAdminDashboard.mockResolvedValue(dashboardData);
    mockListDisputes.mockResolvedValue(emptyDisputesData);

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    await waitFor(() => {
      expect(screen.getByTestId('stat-cards')).toBeInTheDocument();
    });

    expect(screen.getByText('Utilizadores')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Volume total')).toBeInTheDocument();
    expect(screen.getByText('Rating médio')).toBeInTheDocument();
  });

  it('renders dispute table with correct column headers', async () => {
    mockGetAdminDashboard.mockResolvedValue(dashboardData);
    mockListDisputes.mockResolvedValue(disputesData);

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    expect(screen.getByTestId('header-requestTitle')).toHaveTextContent('Pedido');
    expect(screen.getByTestId('header-clientName')).toHaveTextContent('Cliente');
    expect(screen.getByTestId('header-providerName')).toHaveTextContent('Prestador');
    expect(screen.getByTestId('header-amount')).toHaveTextContent('Valor');
    expect(screen.getByTestId('header-createdAt')).toHaveTextContent('Data');
  });

  it('shows empty disputes message when there are none', async () => {
    mockGetAdminDashboard.mockResolvedValue(dashboardData);
    mockListDisputes.mockResolvedValue(emptyDisputesData);

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    await waitFor(() => {
      expect(screen.getByTestId('data-table-empty')).toBeInTheDocument();
    });

    expect(screen.getByText('Sem disputas pendentes')).toBeInTheDocument();
  });

  it('navigates to correct request on dispute row click', async () => {
    const user = userEvent.setup();
    mockGetAdminDashboard.mockResolvedValue(dashboardData);
    mockListDisputes.mockResolvedValue(disputesData);

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    const rows = screen.getAllByTestId('table-row');
    await user.click(rows[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/requests/101');

    await user.click(rows[1]);
    expect(mockNavigate).toHaveBeenCalledWith('/requests/202');
  });

  it('disputes show formatted amount with euro symbol', async () => {
    mockGetAdminDashboard.mockResolvedValue(dashboardData);
    mockListDisputes.mockResolvedValue(disputesData);

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    const amountCells = screen.getAllByTestId('cell-amount');
    expect(amountCells[0]).toHaveTextContent('€250.75');
    expect(amountCells[1]).toHaveTextContent('€180.00');
  });

  it('disputes show formatted date in pt-PT locale', async () => {
    mockGetAdminDashboard.mockResolvedValue(dashboardData);
    mockListDisputes.mockResolvedValue(disputesData);

    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });

    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    const dateCells = screen.getAllByTestId('cell-createdAt');
    // Verify date cells have content (locale formatting varies by environment)
    expect(dateCells[0].textContent).toBeTruthy();
    expect(dateCells[1].textContent).toBeTruthy();
    // The dates should contain the day/month from the createdAt values
    expect(dateCells[0].textContent).toContain('15');
    expect(dateCells[1].textContent).toContain('20');
  });
});
