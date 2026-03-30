import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Transactions } from '../Transactions';

vi.mock('@/api/transactions', () => ({
  getMyTransactions: vi.fn(() =>
    Promise.resolve({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 20,
      first: true,
      last: true,
    }),
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { variants, initial, animate, ...rest } = props;
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

vi.mock('@/features/transactions/components/TransactionDetailModal', () => ({
  TransactionDetailModal: () => null,
}));

describe('Transactions', () => {
  it('renders transactions page title', () => {
    renderWithProviders(<Transactions />, { route: '/transactions' });
    expect(screen.getByText('Transações')).toBeInTheDocument();
  });

  it('shows empty state when no transactions', async () => {
    renderWithProviders(<Transactions />, { route: '/transactions' });
    await waitFor(() => {
      expect(screen.getByText('Nenhuma transação ainda')).toBeInTheDocument();
    });
  });
});
