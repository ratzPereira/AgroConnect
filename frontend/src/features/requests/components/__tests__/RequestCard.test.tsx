import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RequestCard } from '../RequestCard';
import { mockRequestSummary } from '@/test/mocks/data';

function renderCard() {
  return render(
    <MemoryRouter>
      <RequestCard request={mockRequestSummary} />
    </MemoryRouter>,
  );
}

describe('RequestCard', () => {
  it('renders request title', () => {
    renderCard();
    expect(screen.getByText(mockRequestSummary.title)).toBeInTheDocument();
  });

  it('renders category name', () => {
    renderCard();
    expect(screen.getByText(mockRequestSummary.categoryName)).toBeInTheDocument();
  });

  it('renders location with parish and island', () => {
    renderCard();
    expect(
      screen.getByText(`${mockRequestSummary.parish}, ${mockRequestSummary.island}`),
    ).toBeInTheDocument();
  });

  it('renders status badge with Portuguese label', () => {
    renderCard();
    // PUBLISHED status shows "Publicado"
    expect(screen.getByText('Publicado')).toBeInTheDocument();
  });

  it('renders area with unit', () => {
    renderCard();
    expect(
      screen.getByText(`${mockRequestSummary.area} ${mockRequestSummary.areaUnit}`),
    ).toBeInTheDocument();
  });

  it('renders urgency label in Portuguese', () => {
    renderCard();
    // MEDIUM urgency shows "Media"
    expect(screen.getByText('M\u00e9dia')).toBeInTheDocument();
  });

  it('does not render proposal count when zero', () => {
    renderCard();
    expect(screen.queryByText(/proposta/i)).not.toBeInTheDocument();
  });

  it('renders proposal count when greater than zero', () => {
    const requestWithProposals = { ...mockRequestSummary, proposalCount: 3 };
    render(
      <MemoryRouter>
        <RequestCard request={requestWithProposals} />
      </MemoryRouter>,
    );
    expect(screen.getByText('3 propostas')).toBeInTheDocument();
  });

  it('renders singular proposta when count is 1', () => {
    const requestWithOneProposal = { ...mockRequestSummary, proposalCount: 1 };
    render(
      <MemoryRouter>
        <RequestCard request={requestWithOneProposal} />
      </MemoryRouter>,
    );
    expect(screen.getByText('1 proposta')).toBeInTheDocument();
  });
});
