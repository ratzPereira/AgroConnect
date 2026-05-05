import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';

// --- Common mocks ---

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

vi.mock('@/components/AzoresMap', () => ({
  AzoresMap: () => <div data-testid="map" />,
}));

vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({ latitude: null, longitude: null }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

// --- Provider Dashboard mocks ---

vi.mock('@/api/dashboard', () => ({
  getProviderDashboardStats: vi.fn(() =>
    Promise.resolve({
      finance: { totalEarnings: 1500, thisMonthEarnings: 300, pendingPayouts: 100, completedJobs: 5 },
      lowStockItems: [],
      maintenanceDueMachines: [],
    }),
  ),
  getProviderActiveJobs: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/api/pins', () => ({
  getRequestPins: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/features/dashboard/components/DashboardStatCards', () => ({
  DashboardStatCards: () => <div data-testid="stat-cards" />,
}));

vi.mock('@/features/dashboard/components/RevenueChart', () => ({
  RevenueChart: () => <div data-testid="revenue-chart" />,
}));

vi.mock('@/features/dashboard/components/ProviderAlerts', () => ({
  ProviderAlerts: () => null,
}));

vi.mock('@/features/dashboard/components/ProviderJobsList', () => ({
  ProviderJobsList: () => <div data-testid="jobs-list" />,
}));

vi.mock('@/features/calendar/components/UpcomingJobsMini', () => ({
  UpcomingJobsMini: () => <div data-testid="upcoming-jobs" />,
}));

// --- Team mocks ---

vi.mock('@/api/teamMembers', () => ({
  listTeamMembers: vi.fn(() => Promise.resolve([])),
  createTeamMember: vi.fn(),
  deactivateTeamMember: vi.fn(),
}));

// --- Machines mocks ---

vi.mock('@/api/machines', () => ({
  listMachines: vi.fn(() => Promise.resolve([])),
  createMachine: vi.fn(),
  updateMachine: vi.fn(),
  deleteMachine: vi.fn(),
}));

// --- Inventory mocks ---

vi.mock('@/api/inventory', () => ({
  listInventory: vi.fn(() => Promise.resolve([])),
  getLowStockItems: vi.fn(() => Promise.resolve([])),
  createInventoryItem: vi.fn(),
  deleteInventoryItem: vi.fn(),
}));

// --- Finance mocks ---

vi.mock('@/api/finance', () => ({
  getFinanceSummary: vi.fn(() =>
    Promise.resolve({
      totalEarnings: 1500,
      thisMonthEarnings: 300,
      pendingPayouts: 100,
      completedJobs: 5,
    }),
  ),
  getFinanceTransactions: vi.fn(() =>
    Promise.resolve({ content: [], totalPages: 0, number: 0, size: 20, first: true, last: true }),
  ),
  exportFinanceCsv: vi.fn(),
}));

vi.mock('@/features/transactions/components/TransactionDetailModal', () => ({
  TransactionDetailModal: () => null,
}));

// --- Calendar mocks ---

vi.mock('@/features/calendar/hooks/useCalendar', () => ({
  useCalendarEvents: vi.fn(() => ({ data: [], isLoading: false })),
  useCalendarConflicts: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/features/calendar/components/GanttChart', () => ({
  GanttChart: () => <div data-testid="gantt-chart" />,
}));

// --- Tests ---

describe('Provider Pages', () => {
  it('Provider Dashboard renders', async () => {
    const { ProviderDashboard } = await import('../Dashboard');
    renderWithProviders(<ProviderDashboard />, { route: '/provider/dashboard' });
    await waitFor(() => {
      expect(screen.getByText('Painel do Prestador')).toBeInTheDocument();
    });
  });

  it('Team page renders', async () => {
    const { Team } = await import('../Team');
    renderWithProviders(<Team />, { route: '/provider/team' });
    expect(screen.getByText('Equipa')).toBeInTheDocument();
  });

  it('Machines page renders', async () => {
    const { Machines } = await import('../Machines');
    renderWithProviders(<Machines />, { route: '/provider/machines' });
    expect(screen.getByText('Maquinas')).toBeInTheDocument();
  });

  it('Inventory page renders', async () => {
    const { Inventory } = await import('../Inventory');
    renderWithProviders(<Inventory />, { route: '/provider/inventory' });
    expect(screen.getByText('Inventário')).toBeInTheDocument();
  });

  it('Finance page renders', async () => {
    const { Finance } = await import('../Finance');
    renderWithProviders(<Finance />, { route: '/provider/finance' });
    expect(screen.getByText('Finanças')).toBeInTheDocument();
  });

  it('Calendar page renders', async () => {
    const { ProviderCalendar } = await import('../Calendar');
    renderWithProviders(<ProviderCalendar />, { route: '/provider/calendar' });
    expect(screen.getByText('Calendário')).toBeInTheDocument();
  });
});
