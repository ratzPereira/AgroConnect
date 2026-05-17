import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProposalCard } from '../ProposalCard';
import { formatCurrency } from '@/utils/formatCurrency';
import { mockProposal } from '@/test/mocks/data';
import { textEquals } from '@/test/helpers/textMatchers';

describe('ProposalCard', () => {
  it('renders provider name', () => {
    render(<ProposalCard proposal={mockProposal} />);
    expect(screen.getByText(mockProposal.providerName)).toBeInTheDocument();
  });

  it('renders price using pt-PT EUR formatting', () => {
    render(<ProposalCard proposal={mockProposal} />);
    expect(screen.getByText(textEquals(formatCurrency(mockProposal.price)))).toBeInTheDocument();
  });

  it('renders provider rating and review count', () => {
    render(<ProposalCard proposal={mockProposal} />);
    expect(
      screen.getByText(`${mockProposal.providerRating.toFixed(1)} (${mockProposal.providerReviews})`),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<ProposalCard proposal={mockProposal} />);
    expect(screen.getByText(mockProposal.description)).toBeInTheDocument();
  });

  it('renders pricing model label', () => {
    render(<ProposalCard proposal={mockProposal} />);
    // FIXED -> "Preco fixo"
    expect(screen.getByText('Pre\u00e7o fixo')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<ProposalCard proposal={mockProposal} />);
    // PENDING -> "Pendente"
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('renders includes text when present', () => {
    render(<ProposalCard proposal={mockProposal} />);
    expect(screen.getByText(mockProposal.includesText as string)).toBeInTheDocument();
    expect(screen.getByText('Inclui:')).toBeInTheDocument();
  });

  it('renders excludes text when present', () => {
    render(<ProposalCard proposal={mockProposal} />);
    expect(screen.getByText(mockProposal.excludesText as string)).toBeInTheDocument();
    expect(screen.getByText('Exclui:')).toBeInTheDocument();
  });

  it('does not show accept button when isRequestOwner is not set', () => {
    render(<ProposalCard proposal={mockProposal} />);
    expect(screen.queryByRole('button', { name: /aceitar/i })).not.toBeInTheDocument();
  });

  it('shows accept button when isRequestOwner and status is PENDING', () => {
    const onAccept = vi.fn();
    render(<ProposalCard proposal={mockProposal} isRequestOwner onAccept={onAccept} />);
    const acceptBtn = screen.getByRole('button', { name: /aceitar proposta/i });
    expect(acceptBtn).toBeInTheDocument();
  });

  it('calls onAccept with proposal id when accept button is clicked', () => {
    const onAccept = vi.fn();
    render(<ProposalCard proposal={mockProposal} isRequestOwner onAccept={onAccept} />);
    const acceptBtn = screen.getByRole('button', { name: /aceitar proposta/i });
    fireEvent.click(acceptBtn);
    expect(onAccept).toHaveBeenCalledWith(mockProposal.id);
  });

  it('does not show accept button when status is not PENDING', () => {
    const acceptedProposal = { ...mockProposal, status: 'ACCEPTED' as const };
    render(<ProposalCard proposal={acceptedProposal} isRequestOwner onAccept={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /aceitar/i })).not.toBeInTheDocument();
  });
});
