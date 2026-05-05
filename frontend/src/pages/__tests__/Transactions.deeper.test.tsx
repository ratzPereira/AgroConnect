import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Transactions } from '../Transactions';

/* ── Mocks ───────────────────────────────────────────────── */

const mockGetMyTransactions = vi.fn();

vi.mock('@/api/transactions', () => ({
  getMyTransactions: (...args: unknown[]) => mockGetMyTransactions(...args),
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

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: Object.assign(
    () => <div data-testid="skeleton-base" />,
    {
      Line: () => <div data-testid="skeleton-line" />,
      Circle: () => <div data-testid="skeleton-circle" />,
      Rect: () => <div data-testid="skeleton-rect" />,
      Card: () => <div data-testid="skeleton-card" />,
      Stat: () => <div data-testid="skeleton-stat" />,
      Table: () => <div data-testid="skeleton-table" />,
    },
  ),
}));

vi.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title, description }: { title: string; description?: string }) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      {description && <span>{description}</span>}
    </div>
  ),
}));

vi.mock('@/components/illustrations/EmptyTransactions', () => ({
  EmptyTransactions: () => <div data-testid="empty-transactions-illustration" />,
}));

vi.mock('@/features/transactions/components/TransactionCard', () => ({
  TransactionCard: ({ transaction, onClick }: { transaction: { id: number }; onClick: () => void }) => (
    <div data-testid={`transaction-card-${transaction.id}`} onClick={onClick}>
      Transaction #{transaction.id}
    </div>
  ),
}));

vi.mock('@/features/transactions/components/TransactionDetailModal', () => ({
  TransactionDetailModal: ({ open, transaction }: { open: boolean; transaction: { id: number } | null }) =>
    open && transaction ? <div data-testid="tx-detail-modal">Detail #{transaction.id}</div> : null,
}));

/* ── Helpers ─────────────────────────────────────────────── */

function makePage(
  content: { id: number }[],
  overrides: Partial<{
    totalPages: number;
    totalElements: number;
    number: number;
    first: boolean;
    last: boolean;
  }> = {},
) {
  return {
    content,
    totalPages: overrides.totalPages ?? 1,
    totalElements: overrides.totalElements ?? content.length,
    number: overrides.number ?? 0,
    size: 20,
    first: overrides.first ?? true,
    last: overrides.last ?? true,
  };
}

function makeTx(id: number) {
  return {
    id,
    requestId: id + 100,
    proposalId: id + 200,
    amount: 150,
    commissionRate: 0.1,
    commissionAmount: 15,
    providerPayout: 135,
    status: 'RELEASED' as const,
    heldAt: '2026-03-10T09:00:00Z',
    releasedAt: '2026-03-15T14:00:00Z',
    refundedAt: null,
    createdAt: '2026-03-10T08:00:00Z',
  };
}

/* ── Tests ───────────────────────────────────────────────── */

describe('Transactions — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title "Transações"', () => {
    mockGetMyTransactions.mockResolvedValue(makePage([]));
    renderWithProviders(<Transactions />, { route: '/transactions' });
    expect(screen.getByText('Transações')).toBeInTheDocument();
  });

  it('shows loading skeleton', () => {
    // Never resolve — keeps isLoading true
    mockGetMyTransactions.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Transactions />, { route: '/transactions' });
    expect(screen.getByTestId('skeleton-table')).toBeInTheDocument();
  });

  it('shows empty state "Nenhuma transação ainda"', async () => {
    mockGetMyTransactions.mockResolvedValue(makePage([]));
    renderWithProviders(<Transactions />, { route: '/transactions' });
    await waitFor(() => {
      expect(screen.getByText('Nenhuma transação ainda')).toBeInTheDocument();
    });
  });

  it('renders transaction cards when data is present', async () => {
    mockGetMyTransactions.mockResolvedValue(makePage([makeTx(1), makeTx(2)]));
    renderWithProviders(<Transactions />, { route: '/transactions' });
    await waitFor(() => {
      expect(screen.getByTestId('transaction-card-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('transaction-card-2')).toBeInTheDocument();
  });

  it('shows pagination for multiple pages', async () => {
    mockGetMyTransactions.mockResolvedValue(
      makePage([makeTx(1)], { totalPages: 3, first: true, last: false }),
    );
    renderWithProviders(<Transactions />, { route: '/transactions' });
    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
    expect(screen.getByText('Anterior')).toBeInTheDocument();
    expect(screen.getByText('Seguinte')).toBeInTheDocument();
  });

  it('hides pagination for single page', async () => {
    mockGetMyTransactions.mockResolvedValue(
      makePage([makeTx(1)], { totalPages: 1, first: true, last: true }),
    );
    renderWithProviders(<Transactions />, { route: '/transactions' });
    await waitFor(() => {
      expect(screen.getByTestId('transaction-card-1')).toBeInTheDocument();
    });
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
    expect(screen.queryByText('Seguinte')).not.toBeInTheDocument();
  });

  it('previous button disabled on first page', async () => {
    mockGetMyTransactions.mockResolvedValue(
      makePage([makeTx(1)], { totalPages: 3, number: 0, first: true, last: false }),
    );
    renderWithProviders(<Transactions />, { route: '/transactions' });
    await waitFor(() => {
      expect(screen.getByText('Anterior')).toBeInTheDocument();
    });
    expect(screen.getByText('Anterior').closest('button')).toBeDisabled();
    expect(screen.getByText('Seguinte').closest('button')).not.toBeDisabled();
  });

  it('next button disabled on last page', async () => {
    mockGetMyTransactions.mockResolvedValue(
      makePage([makeTx(1)], { totalPages: 3, number: 2, first: false, last: true }),
    );
    renderWithProviders(<Transactions />, { route: '/transactions' });
    await waitFor(() => {
      expect(screen.getByText('Seguinte')).toBeInTheDocument();
    });
    expect(screen.getByText('Seguinte').closest('button')).toBeDisabled();
    expect(screen.getByText('Anterior').closest('button')).not.toBeDisabled();
  });
});
