import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveRequestCards } from '../ActiveRequestCards';
import type { ServiceRequestSummary } from '@/types/request';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('lucide-react', () => ({
  Plus: (props: Record<string, unknown>) => <svg data-testid="plus-icon" {...props} />,
}));

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

describe('ActiveRequestCards', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows "Crie o seu primeiro pedido" when empty', () => {
    render(<ActiveRequestCards requests={[]} />);
    expect(screen.getByText('Crie o seu primeiro pedido')).toBeInTheDocument();
  });

  it('navigates to /requests/new when empty state button clicked', () => {
    render(<ActiveRequestCards requests={[]} />);
    fireEvent.click(screen.getByText('Crie o seu primeiro pedido').closest('button')!);
    expect(mockNavigate).toHaveBeenCalledWith('/requests/new');
  });

  it('renders request cards with titles', () => {
    render(<ActiveRequestCards requests={mockRequests} />);
    expect(screen.getByText('Lavoura de terreno')).toBeInTheDocument();
    expect(screen.getByText('Limpeza de terreno')).toBeInTheDocument();
  });

  it('renders "Novo Pedido" card at end', () => {
    render(<ActiveRequestCards requests={mockRequests} />);
    expect(screen.getByText('Novo Pedido')).toBeInTheDocument();
  });

  it('navigates to request detail on card click', () => {
    render(<ActiveRequestCards requests={mockRequests} />);
    const card = screen.getByText('Lavoura de terreno').closest('button');
    fireEvent.click(card!);
    expect(mockNavigate).toHaveBeenCalledWith('/requests/1');
  });

  it('navigates to /requests/new on "Novo Pedido" card click', () => {
    render(<ActiveRequestCards requests={mockRequests} />);
    const newCard = screen.getByText('Novo Pedido').closest('button');
    fireEvent.click(newCard!);
    expect(mockNavigate).toHaveBeenCalledWith('/requests/new');
  });

  it('renders status badges for each request', () => {
    render(<ActiveRequestCards requests={mockRequests} />);
    expect(screen.getByText('Publicado')).toBeInTheDocument();
    expect(screen.getByText('Com Propostas')).toBeInTheDocument();
  });
});
