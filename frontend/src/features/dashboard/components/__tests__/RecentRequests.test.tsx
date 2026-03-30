import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentRequests } from '../RecentRequests';
import type { ServiceRequestSummary } from '@/types/request';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [k: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'há 2 dias',
}));

vi.mock('date-fns/locale/pt', () => ({ pt: {} }));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

const mockRequests: ServiceRequestSummary[] = [
  {
    id: 1,
    categoryName: 'Lavoura',
    status: 'PUBLISHED',
    title: 'Lavoura de terreno',
    parish: 'Angra',
    municipality: 'Angra',
    island: 'Terceira',
    area: 2,
    areaUnit: 'ha',
    urgency: 'MEDIUM',
    proposalCount: 0,
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 2,
    categoryName: 'Limpeza',
    status: 'WITH_PROPOSALS',
    title: 'Limpeza de terreno',
    parish: 'Ponta Delgada',
    municipality: 'Ponta Delgada',
    island: 'São Miguel',
    area: 1,
    areaUnit: 'ha',
    urgency: 'LOW',
    proposalCount: 2,
    createdAt: '2026-03-05T14:00:00Z',
  },
];

describe('RecentRequests', () => {
  it('returns null when no requests', () => {
    const { container } = render(<RecentRequests requests={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders heading "Pedidos recentes"', () => {
    render(<RecentRequests requests={mockRequests} />);
    expect(screen.getByText('Pedidos recentes')).toBeInTheDocument();
  });

  it('renders request titles', () => {
    render(<RecentRequests requests={mockRequests} />);
    expect(screen.getByText('Lavoura de terreno')).toBeInTheDocument();
    expect(screen.getByText('Limpeza de terreno')).toBeInTheDocument();
  });

  it('renders status badges with correct labels', () => {
    render(<RecentRequests requests={mockRequests} />);
    expect(screen.getByText('Publicado')).toBeInTheDocument();
    expect(screen.getByText('Com propostas')).toBeInTheDocument();
  });

  it('renders "Ver todos" link pointing to /requests', () => {
    render(<RecentRequests requests={mockRequests} />);
    const link = screen.getByText('Ver todos');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/requests');
  });

  it('renders category name and relative time for each request', () => {
    render(<RecentRequests requests={mockRequests} />);
    expect(screen.getAllByText(/há 2 dias/)).toHaveLength(2);
    expect(screen.getAllByText(/Lavoura/).length).toBeGreaterThanOrEqual(1);
  });
});
