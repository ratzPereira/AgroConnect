import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RequestStatusBadge } from '../RequestStatusBadge';
import type { RequestStatus } from '@/types/request';

// Exact labels from the component's statusConfig
const statusLabels: Record<RequestStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  WITH_PROPOSALS: 'Com Propostas',
  AWARDED: 'Adjudicado',
  IN_PROGRESS: 'Em Curso',
  AWAITING_CONFIRMATION: 'Aguarda Confirma\u00e7\u00e3o',
  COMPLETED: 'Conclu\u00eddo',
  RATED: 'Avaliado',
  DISPUTED: 'Em Disputa',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

describe('RequestStatusBadge', () => {
  it.each(Object.entries(statusLabels) as [RequestStatus, string][])(
    'renders Portuguese label for %s',
    (status, expectedLabel) => {
      render(<RequestStatusBadge status={status} />);
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    },
  );

  it('renders as a span element', () => {
    render(<RequestStatusBadge status="PUBLISHED" />);
    const badge = screen.getByText('Publicado');
    expect(badge.tagName).toBe('SPAN');
  });

  it('applies styling classes', () => {
    render(<RequestStatusBadge status="PUBLISHED" />);
    const badge = screen.getByText('Publicado');
    expect(badge.className).toContain('rounded-full');
    expect(badge.className).toContain('text-xs');
    expect(badge.className).toContain('font-medium');
  });

  it('applies status-specific color classes', () => {
    render(<RequestStatusBadge status="COMPLETED" />);
    const badge = screen.getByText('Conclu\u00eddo');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-700');
  });
});
