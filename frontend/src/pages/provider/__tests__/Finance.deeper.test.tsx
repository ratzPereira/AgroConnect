import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { getFinanceSummary, getFinanceTransactions, exportFinanceCsv } from '@/api/finance';
import type { FinanceSummary, TransactionItem } from '@/api/finance';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { variants, initial, animate, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/illustrations/EmptyTransactions', () => ({
  EmptyTransactions: (props: Record<string, unknown>) => (
    <div data-testid="empty-transactions-illustration" {...props} />
  ),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

vi.mock('@/features/transactions/components/TransactionDetailModal', () => ({
  TransactionDetailModal: ({ open, transaction, onClose }: { open: boolean; transaction: unknown; onClose: () => void }) =>
    open ? <div data-testid="transaction-modal"><button onClick={onClose}>close-modal</button></div> : null,
}));

vi.mock('@/api/finance', () => ({
  getFinanceSummary: vi.fn(),
  getFinanceTransactions: vi.fn(),
  exportFinanceCsv: vi.fn(),
}));

const mockSummary: FinanceSummary = {
  totalRevenue: 2000,
  totalCommissions: 200,
  totalEarnings: 1800,
  pendingPayouts: 350,
  thisMonthEarnings: 450.5,
  completedJobs: 12,
  avgJobValue: 150,
};

const mockTransactions: TransactionItem[] = [
  {
    id: 101,
    requestId: 10,
    proposalId: 20,
    amount: 500.0,
    commissionRate: 0.1,
    commissionAmount: 50.0,
    providerPayout: 450.0,
    status: 'RELEASED',
    heldAt: '2026-03-10T10:00:00Z',
    releasedAt: '2026-03-15T14:00:00Z',
    refundedAt: null,
    createdAt: '2026-03-09T08:00:00Z',
  },
  {
    id: 102,
    requestId: 11,
    proposalId: 21,
    amount: 300.0,
    commissionRate: 0.1,
    commissionAmount: 30.0,
    providerPayout: 270.0,
    status: 'HELD',
    heldAt: '2026-03-20T10:00:00Z',
    releasedAt: null,
    refundedAt: null,
    createdAt: '2026-03-19T08:00:00Z',
  },
  {
    id: 103,
    requestId: 12,
    proposalId: 22,
    amount: 200.0,
    commissionRate: 0.1,
    commissionAmount: 20.0,
    providerPayout: 180.0,
    status: 'REFUNDED',
    heldAt: '2026-03-22T10:00:00Z',
    releasedAt: null,
    refundedAt: '2026-03-25T10:00:00Z',
    createdAt: '2026-03-21T08:00:00Z',
  },
];

async function renderFinancePage() {
  const { Finance } = await import('../Finance');
  return renderWithProviders(<Finance />, { route: '/provider/finance' });
}

describe('Finance Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons while summary is loading', async () => {
    let resolveSummary: (value: FinanceSummary) => void;
    (getFinanceSummary as Mock).mockReturnValue(
      new Promise<FinanceSummary>((resolve) => { resolveSummary = resolve; }),
    );
    (getFinanceTransactions as Mock).mockResolvedValue({
      content: [],
      totalPages: 0,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    await renderFinancePage();

    // Skeleton.Stat renders stat-card placeholders and Skeleton.Table renders a table skeleton
    const skeletonContainers = document.querySelectorAll('.rounded-xl.border');
    expect(skeletonContainers.length).toBeGreaterThanOrEqual(4);

    resolveSummary!(mockSummary);
    await waitFor(() => {
      expect(screen.getByText('Ganhos totais')).toBeInTheDocument();
    });
  });

  it('renders stat cards with summary data after loading', async () => {
    (getFinanceSummary as Mock).mockResolvedValue(mockSummary);
    (getFinanceTransactions as Mock).mockResolvedValue({
      content: mockTransactions,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('Ganhos totais')).toBeInTheDocument();
    });
    expect(screen.getByText('Este mês')).toBeInTheDocument();
    expect(screen.getByText('Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Trabalhos concluídos')).toBeInTheDocument();
  });

  it('renders transaction table with correct data', async () => {
    (getFinanceSummary as Mock).mockResolvedValue(mockSummary);
    (getFinanceTransactions as Mock).mockResolvedValue({
      content: mockTransactions,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('#101')).toBeInTheDocument();
    });

    // Transaction IDs
    expect(screen.getByText('#102')).toBeInTheDocument();
    expect(screen.getByText('#103')).toBeInTheDocument();

    // Amounts
    expect(screen.getByText('€500.00')).toBeInTheDocument();
    expect(screen.getByText('€300.00')).toBeInTheDocument();
    expect(screen.getByText('€200.00')).toBeInTheDocument();

    // Commission amounts
    expect(screen.getByText('€50.00')).toBeInTheDocument();
    expect(screen.getByText('€30.00')).toBeInTheDocument();
    expect(screen.getByText('€20.00')).toBeInTheDocument();

    // Provider payouts
    expect(screen.getByText('€450.00')).toBeInTheDocument();
    expect(screen.getByText('€270.00')).toBeInTheDocument();
    expect(screen.getByText('€180.00')).toBeInTheDocument();
  });

  it('status badges show correct text', async () => {
    (getFinanceSummary as Mock).mockResolvedValue(mockSummary);
    (getFinanceTransactions as Mock).mockResolvedValue({
      content: mockTransactions,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('Libertado')).toBeInTheDocument();
    });
    expect(screen.getByText('Retido')).toBeInTheDocument();
    expect(screen.getByText('Reembolsado')).toBeInTheDocument();
  });

  it('clicking a transaction row opens the detail modal', async () => {
    (getFinanceSummary as Mock).mockResolvedValue(mockSummary);
    (getFinanceTransactions as Mock).mockResolvedValue({
      content: mockTransactions,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });
    const user = userEvent.setup();

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('#101')).toBeInTheDocument();
    });

    // Click on the first transaction row
    const firstRow = screen.getByText('#101').closest('tr');
    expect(firstRow).toBeTruthy();
    await user.click(firstRow!);

    await waitFor(() => {
      expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
    });
  });

  it('export CSV button triggers the export mutation', async () => {
    (getFinanceSummary as Mock).mockResolvedValue(mockSummary);
    (getFinanceTransactions as Mock).mockResolvedValue({
      content: mockTransactions,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });
    (exportFinanceCsv as Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Exportar CSV'));

    await waitFor(() => {
      expect(exportFinanceCsv).toHaveBeenCalled();
    });
  });

  it('renders date inputs for export range', async () => {
    (getFinanceSummary as Mock).mockResolvedValue(mockSummary);
    (getFinanceTransactions as Mock).mockResolvedValue({
      content: mockTransactions,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
    });

    const dateInputs = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    expect(dateInputs).toHaveLength(2);

    // The "from" input should be ~3 months ago, the "to" input should be today
    expect(dateInputs[0]).toHaveAttribute('type', 'date');
    expect(dateInputs[1]).toHaveAttribute('type', 'date');
  });

  it('renders empty state when no transactions exist', async () => {
    (getFinanceSummary as Mock).mockResolvedValue(mockSummary);
    (getFinanceTransactions as Mock).mockResolvedValue({
      content: [],
      totalPages: 0,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('Sem transações')).toBeInTheDocument();
    });
    expect(
      screen.getByText('O histórico de transações aparecerá aqui quando tiver serviços concluídos.'),
    ).toBeInTheDocument();
  });
});
