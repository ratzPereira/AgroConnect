import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionCard } from '../TransactionCard';
import { mockTransaction } from '@/test/mocks/data';

describe('TransactionCard', () => {
  it('renders transaction amount with two decimals and euro symbol', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    expect(screen.getByText(`${mockTransaction.amount.toFixed(2)} \u20AC`)).toBeInTheDocument();
  });

  it('renders status badge with Portuguese label', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    // RELEASED -> "Libertado"
    expect(screen.getByText('Libertado')).toBeInTheDocument();
  });

  it('renders commission amount', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    expect(screen.getByText(`${mockTransaction.commissionAmount.toFixed(2)} \u20AC`)).toBeInTheDocument();
  });

  it('renders provider payout', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    expect(screen.getByText(`${mockTransaction.providerPayout.toFixed(2)} \u20AC`)).toBeInTheDocument();
  });

  it('renders request ID reference', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    expect(screen.getByText(`Pedido #${mockTransaction.requestId}`)).toBeInTheDocument();
  });

  it('renders commission rate percentage', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    const pct = (mockTransaction.commissionRate * 100).toFixed(0);
    expect(screen.getByText(`Comiss\u00e3o (${pct}%)`)).toBeInTheDocument();
  });

  it('renders created date in dd/MM/yyyy format', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    // 2026-02-15T10:00:00Z -> 15/02/2026
    expect(screen.getByText('15/02/2026')).toBeInTheDocument();
  });

  it('renders held date when present', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    expect(screen.getByText(/Retido:/)).toBeInTheDocument();
  });

  it('renders released date when present', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    expect(screen.getByText(/Libertado:/)).toBeInTheDocument();
  });

  it('does not render refunded date when null', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    expect(screen.queryByText(/Reembolsado:/)).not.toBeInTheDocument();
  });
});
