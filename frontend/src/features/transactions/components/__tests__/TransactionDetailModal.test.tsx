import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionDetailModal } from '../TransactionDetailModal';
import type { Transaction } from '@/types/transaction';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const mockTransaction: Transaction = {
  id: 42,
  requestId: 10,
  proposalId: 5,
  amount: 250.0,
  commissionRate: 0.12,
  commissionAmount: 30.0,
  providerPayout: 220.0,
  status: 'RELEASED',
  heldAt: '2026-03-10T09:00:00Z',
  releasedAt: '2026-03-15T14:30:00Z',
  refundedAt: null,
  createdAt: '2026-03-10T08:00:00Z',
};

describe('TransactionDetailModal', () => {
  const defaultProps = {
    transaction: mockTransaction,
    open: true,
    onClose: vi.fn(),
  };

  it('returns null when transaction is null', () => {
    const { container } = render(
      <TransactionDetailModal transaction={null} open={true} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders transaction ID and amount', () => {
    render(<TransactionDetailModal {...defaultProps} />);
    expect(screen.getByText(/Transa\u00e7\u00e3o #42/)).toBeInTheDocument();
    expect(screen.getByText('250.00 \u20AC')).toBeInTheDocument();
  });

  it('shows commission breakdown', () => {
    render(<TransactionDetailModal {...defaultProps} />);
    // Commission label with percentage
    expect(screen.getByText(/Comiss\u00e3o \(12%\)/)).toBeInTheDocument();
    // Commission amount
    expect(screen.getByText('-30.00 \u20AC')).toBeInTheDocument();
    // Provider payout
    expect(screen.getByText('220.00 \u20AC')).toBeInTheDocument();
  });

  it('shows status explanation text', () => {
    render(<TransactionDetailModal {...defaultProps} />);
    expect(
      screen.getByText(/pagamento foi libertado ao prestador/i),
    ).toBeInTheDocument();
  });
});
