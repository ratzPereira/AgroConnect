import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/api/admin', () => ({
  getAdminDashboard: vi.fn(() =>
    Promise.resolve({
      totalUsers: 150,
      totalClients: 100,
      totalProviders: 40,
      totalRequests: 42,
      activeRequests: 10,
      totalVolume: 12500.5,
      totalCommissions: 1500.06,
      pendingDisputes: 2,
      avgPlatformRating: 4.3,
      totalListings: 30,
      activeListings: 20,
      soldListings: 8,
    }),
  ),
  getAdminAnalytics: vi.fn(() =>
    Promise.resolve({
      usersByRole: [{ label: 'CLIENT', count: 100 }, { label: 'PROVIDER_MANAGER', count: 40 }],
      requestsByStatus: [{ label: 'PUBLISHED', count: 3 }, { label: 'DISPUTED', count: 2 }],
      registrationsDaily: [{ date: '2026-06-01', count: 1 }],
      requestsDaily: [{ date: '2026-06-01', count: 2 }],
      revenueDaily: [{ date: '2026-06-01', amount: 100, commission: 12 }],
    }),
  ),
  listDisputes: vi.fn(() =>
    Promise.resolve({ content: [], totalPages: 0, number: 0, size: 20, first: true, last: true }),
  ),
  listUsers: vi.fn(() =>
    Promise.resolve({
      content: [
        {
          id: 1,
          name: 'João',
          email: 'joao@test.pt',
          role: 'CLIENT' as const,
          active: true,
          requestCount: 5,
          proposalCount: 0,
          createdAt: '2026-01-01T10:00:00Z',
        },
      ],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    }),
  ),
  banUser: vi.fn(),
  unbanUser: vi.fn(),
}));

vi.mock('@/features/dashboard/components/DashboardStatCards', () => ({
  DashboardStatCards: ({ stats }: { stats: Array<{ label: string }> }) => (
    <div data-testid="stat-cards">
      {stats.map((s) => (
        <span key={s.label}>{s.label}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table" />,
}));

describe('Admin Pages', () => {
  it('Admin Dashboard renders', async () => {
    const { AdminDashboard } = await import('../Dashboard');
    renderWithProviders(<AdminDashboard />, { route: '/admin/dashboard' });
    await waitFor(() => {
      expect(screen.getByText('Administração')).toBeInTheDocument();
    });
  });

  it('Users page renders', async () => {
    const { AdminUsers } = await import('../Users');
    renderWithProviders(<AdminUsers />, { route: '/admin/users' });
    expect(screen.getByText('Utilizadores')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('João')).toBeInTheDocument();
    });
  });
});
