import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextActionsPanel } from '../NextActionsPanel';
import type { ServiceRequestSummary } from '@/types/request';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('lucide-react', () => ({
  AlertCircle: (props: Record<string, unknown>) => <svg data-testid="icon-alert-circle" {...props} />,
  CheckCircle: (props: Record<string, unknown>) => <svg data-testid="icon-check-circle" {...props} />,
  Star: (props: Record<string, unknown>) => <svg data-testid="icon-star" {...props} />,
  Clock: (props: Record<string, unknown>) => <svg data-testid="icon-clock" {...props} />,
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardBody: ({ children }: { children: React.ReactNode }) => <div data-testid="card-body">{children}</div>,
}));

const makeRequest = (overrides: Partial<ServiceRequestSummary> = {}): ServiceRequestSummary => ({
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
  ...overrides,
});

describe('NextActionsPanel', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('returns null when no actions needed', () => {
    const requests = [makeRequest({ status: 'PUBLISHED', proposalCount: 0, createdAt: new Date().toISOString() })];
    const { container } = render(<NextActionsPanel requests={requests} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows "avaliar" action for WITH_PROPOSALS requests', () => {
    const requests = [
      makeRequest({ id: 10, status: 'WITH_PROPOSALS', title: 'Limpeza de campo', proposalCount: 3 }),
    ];
    render(<NextActionsPanel requests={requests} />);
    expect(screen.getByText(/3 propostas para avaliar em "Limpeza de campo"/)).toBeInTheDocument();
  });

  it('shows "confirme" action for AWAITING_CONFIRMATION requests', () => {
    const requests = [
      makeRequest({ id: 20, status: 'AWAITING_CONFIRMATION', title: 'Poda de árvores' }),
    ];
    render(<NextActionsPanel requests={requests} />);
    expect(screen.getByText(/Confirme a conclusão de "Poda de árvores"/)).toBeInTheDocument();
  });

  it('shows "avalie" action for COMPLETED requests', () => {
    const requests = [
      makeRequest({ id: 30, status: 'COMPLETED', title: 'Rega automática' }),
    ];
    render(<NextActionsPanel requests={requests} />);
    expect(screen.getByText(/Avalie o serviço "Rega automática"/)).toBeInTheDocument();
  });

  it('navigates to request detail on click', () => {
    const requests = [
      makeRequest({ id: 42, status: 'COMPLETED', title: 'Serviço completo' }),
    ];
    render(<NextActionsPanel requests={requests} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/requests/42');
  });

  it('renders heading "Ações Pendentes"', () => {
    const requests = [
      makeRequest({ id: 1, status: 'COMPLETED', title: 'Teste' }),
    ];
    render(<NextActionsPanel requests={requests} />);
    expect(screen.getByText('Ações Pendentes')).toBeInTheDocument();
  });
});
