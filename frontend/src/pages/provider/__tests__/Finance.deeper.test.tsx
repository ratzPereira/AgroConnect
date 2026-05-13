import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import {
  getFinanceSummary,
  getFinanceTransactions,
  getMonthlyBreakdown,
  getYearlyComparison,
  exportFinanceCsv,
} from '@/api/finance';
import type {
  FinanceSummary,
  MonthlyBreakdown,
  TransactionItem,
  YearlyComparison,
} from '@/api/finance';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { variants: _v, initial: _i, animate: _a, ...rest } = props;
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
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

vi.mock('@/features/transactions/components/TransactionDetailModal', () => ({
  TransactionDetailModal: ({ open, transaction: _transaction, onClose }: { open: boolean; transaction: unknown; onClose: () => void }) =>
    open ? <div data-testid="transaction-modal"><button onClick={onClose}>close-modal</button></div> : null,
}));

vi.mock('@/api/finance', () => ({
  getFinanceSummary: vi.fn(),
  getFinanceTransactions: vi.fn(),
  getMonthlyBreakdown: vi.fn(),
  getYearlyComparison: vi.fn(),
  exportFinanceCsv: vi.fn(),
}));

const currentYear = new Date().getFullYear();

const mockSummary: FinanceSummary = {
  totalRevenue: 2000,
  totalCommissions: 200,
  totalEarnings: 1800,
  pendingPayouts: 350,
  thisMonthEarnings: 450.5,
  completedJobs: 12,
  avgJobValue: 150,
  year: currentYear,
  yearRevenue: 12000,
  yearCommissions: 1200,
  yearPayouts: 10800,
  yearMaterialsCost: 1500,
  yearLaborCost: 2000,
  yearMachineExpenses: 500,
  yearNetProfit: 6800,
  yearMargin: 56.67,
  yearCompletedJobs: 10,
  yearAvgJobValue: 1200,
  yearAvgJobProfit: 680,
};

const mockBreakdown: MonthlyBreakdown = {
  year: currentYear,
  months: Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue: 1000 * (i + 1),
    payouts: 900 * (i + 1),
    materialsCost: 100,
    laborCost: 150,
    machineExpenses: 50,
    netProfit: 900 * (i + 1) - 300,
    completedJobs: i + 1,
  })),
};

const mockComparison: YearlyComparison = {
  currentYear,
  previousYear: currentYear - 1,
  currentRevenue: 12000,
  previousRevenue: 10000,
  revenueDeltaPct: 20,
  currentProfit: 6800,
  previousProfit: 5500,
  profitDeltaPct: 23.64,
  currentJobs: 10,
  previousJobs: 8,
};

const mockTransactions: TransactionItem[] = [
  {
    id: 101, requestId: 10, proposalId: 20,
    amount: 500.0, commissionRate: 0.1, commissionAmount: 50.0, providerPayout: 450.0,
    status: 'RELEASED',
    heldAt: '2026-03-10T10:00:00Z', releasedAt: '2026-03-15T14:00:00Z', refundedAt: null,
    createdAt: '2026-03-09T08:00:00Z',
  },
  {
    id: 102, requestId: 11, proposalId: 21,
    amount: 300.0, commissionRate: 0.1, commissionAmount: 30.0, providerPayout: 270.0,
    status: 'HELD',
    heldAt: '2026-03-20T10:00:00Z', releasedAt: null, refundedAt: null,
    createdAt: '2026-03-19T08:00:00Z',
  },
  {
    id: 103, requestId: 12, proposalId: 22,
    amount: 200.0, commissionRate: 0.1, commissionAmount: 20.0, providerPayout: 180.0,
    status: 'REFUNDED',
    heldAt: '2026-03-22T10:00:00Z', releasedAt: null, refundedAt: '2026-03-25T10:00:00Z',
    createdAt: '2026-03-21T08:00:00Z',
  },
];

async function renderFinancePage() {
  const { Finance } = await import('../Finance');
  return renderWithProviders(<Finance />, { route: '/provider/finance' });
}

function setupAllMocks(overrides: Partial<{
  summary: FinanceSummary | null;
  breakdown: MonthlyBreakdown;
  comparison: YearlyComparison;
  transactions: TransactionItem[];
}> = {}) {
  (getFinanceSummary as Mock).mockResolvedValue(overrides.summary ?? mockSummary);
  (getMonthlyBreakdown as Mock).mockResolvedValue(overrides.breakdown ?? mockBreakdown);
  (getYearlyComparison as Mock).mockResolvedValue(overrides.comparison ?? mockComparison);
  (getFinanceTransactions as Mock).mockResolvedValue({
    content: overrides.transactions ?? mockTransactions,
    totalPages: 1,
    number: 0,
    size: 20,
    first: true,
    last: true,
  });
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
    (getMonthlyBreakdown as Mock).mockResolvedValue(mockBreakdown);
    (getYearlyComparison as Mock).mockResolvedValue(mockComparison);
    (getFinanceTransactions as Mock).mockResolvedValue({
      content: [], totalPages: 0, number: 0, size: 20, first: true, last: true,
    });

    await renderFinancePage();

    const skeletonContainers = document.querySelectorAll('.rounded-xl.border');
    expect(skeletonContainers.length).toBeGreaterThanOrEqual(4);

    resolveSummary!(mockSummary);
    await waitFor(() => {
      expect(screen.getByText('Receita do ano')).toBeInTheDocument();
    });
  });

  it('renders annual stat cards with summary data after loading', async () => {
    setupAllMocks();

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('Receita do ano')).toBeInTheDocument();
    });
    expect(screen.getByText('Lucro líquido do ano')).toBeInTheDocument();
    expect(screen.getByText('Margem')).toBeInTheDocument();
    expect(screen.getByText('Trabalhos no ano')).toBeInTheDocument();
    expect(screen.getByText('Materiais')).toBeInTheDocument();
    expect(screen.getByText('Mão de obra')).toBeInTheDocument();
    expect(screen.getByText('Despesas de máquinas')).toBeInTheDocument();
    expect(screen.getByText('Lucro médio / trabalho')).toBeInTheDocument();
  });

  it('renders lifetime totals section', async () => {
    setupAllMocks();

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('Totais acumulados')).toBeInTheDocument();
    });
    expect(screen.getByText('Ganhos totais')).toBeInTheDocument();
    expect(screen.getByText('Este mês')).toBeInTheDocument();
    expect(screen.getByText('Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Trabalhos concluídos')).toBeInTheDocument();
  });

  it('renders monthly chart container when breakdown loaded', async () => {
    setupAllMocks();

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
    expect(screen.getByText(new RegExp(`Receita vs lucro líquido — ${currentYear}`))).toBeInTheDocument();
  });

  it('year selector changes selectedYear and refetches summary', async () => {
    setupAllMocks();
    const user = userEvent.setup();

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByLabelText('Ano')).toBeInTheDocument();
    });

    const yearSelect = screen.getByLabelText('Ano') as HTMLSelectElement;
    await user.selectOptions(yearSelect, String(currentYear - 1));

    await waitFor(() => {
      expect(getFinanceSummary).toHaveBeenCalledWith(currentYear - 1);
      expect(getMonthlyBreakdown).toHaveBeenCalledWith(currentYear - 1);
    });
  });

  it('renders transaction table with correct data', async () => {
    setupAllMocks();

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('#101')).toBeInTheDocument();
    });
    expect(screen.getByText('#102')).toBeInTheDocument();
    expect(screen.getByText('#103')).toBeInTheDocument();
    expect(screen.getByText('€500.00')).toBeInTheDocument();
    expect(screen.getByText('€300.00')).toBeInTheDocument();
    expect(screen.getByText('€200.00')).toBeInTheDocument();
  });

  it('status badges show correct text', async () => {
    setupAllMocks();

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('Libertado')).toBeInTheDocument();
    });
    expect(screen.getByText('Retido')).toBeInTheDocument();
    expect(screen.getByText('Reembolsado')).toBeInTheDocument();
  });

  it('clicking a transaction row opens the detail modal', async () => {
    setupAllMocks();
    const user = userEvent.setup();

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('#101')).toBeInTheDocument();
    });
    const firstRow = screen.getByText('#101').closest('tr');
    expect(firstRow).toBeTruthy();
    await user.click(firstRow!);

    await waitFor(() => {
      expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
    });
  });

  it('export CSV button triggers the export mutation', async () => {
    setupAllMocks();
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
    setupAllMocks();

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
    });
    const dateInputs = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    expect(dateInputs).toHaveLength(2);
    expect(dateInputs[0]).toHaveAttribute('type', 'date');
    expect(dateInputs[1]).toHaveAttribute('type', 'date');
  });

  it('renders empty state when no transactions exist', async () => {
    setupAllMocks({ transactions: [] });

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('Sem transações')).toBeInTheDocument();
    });
    expect(
      screen.getByText('O histórico de transações aparecerá aqui quando tiver serviços concluídos.'),
    ).toBeInTheDocument();
  });

  it('chart shows empty message when breakdown has no months', async () => {
    setupAllMocks({ breakdown: { year: currentYear, months: [] } });

    await renderFinancePage();

    await waitFor(() => {
      expect(screen.getByText('Sem dados para este ano.')).toBeInTheDocument();
    });
  });
});
