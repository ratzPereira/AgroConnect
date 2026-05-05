import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionStatusBadge } from '../TransactionStatusBadge';

describe('TransactionStatusBadge', () => {
  it('renders PENDING status with correct label and styling', () => {
    render(<TransactionStatusBadge status="PENDING" />);
    const badge = screen.getByText('Pendente');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-neutral-100');
    expect(badge.className).toContain('text-neutral-600');
  });

  it('renders HELD status with correct label and styling', () => {
    render(<TransactionStatusBadge status="HELD" />);
    const badge = screen.getByText('Retido');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-yellow-100');
    expect(badge.className).toContain('text-yellow-700');
  });

  it('renders RELEASED status with correct label and styling', () => {
    render(<TransactionStatusBadge status="RELEASED" />);
    const badge = screen.getByText('Libertado');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-700');
  });

  it('renders REFUNDED status with correct label and styling', () => {
    render(<TransactionStatusBadge status="REFUNDED" />);
    const badge = screen.getByText('Reembolsado');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-700');
  });

  it('renders PARTIALLY_REFUNDED status with correct label and styling', () => {
    render(<TransactionStatusBadge status="PARTIALLY_REFUNDED" />);
    const badge = screen.getByText('Parcialmente Reembolsado');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-orange-100');
    expect(badge.className).toContain('text-orange-700');
  });

  it('renders as inline-flex span with rounded-full styling', () => {
    render(<TransactionStatusBadge status="HELD" />);
    const badge = screen.getByText('Retido');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toContain('rounded-full');
    expect(badge.className).toContain('text-xs');
    expect(badge.className).toContain('font-medium');
  });
});
