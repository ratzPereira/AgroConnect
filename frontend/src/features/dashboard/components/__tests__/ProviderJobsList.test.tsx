import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderJobsList } from '../ProviderJobsList';
import type { ActiveJob } from '@/types/pin';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('lucide-react', () => ({
  Users: (props: Record<string, unknown>) => <svg data-testid="icon-users" {...props} />,
  MapPin: (props: Record<string, unknown>) => <svg data-testid="icon-map-pin" {...props} />,
  Camera: (props: Record<string, unknown>) => <svg data-testid="icon-camera" {...props} />,
  Clock: (props: Record<string, unknown>) => <svg data-testid="icon-clock" {...props} />,
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardBody: ({ children }: { children: React.ReactNode }) => <div data-testid="card-body">{children}</div>,
}));

const mockJobs: ActiveJob[] = [
  {
    executionId: 1,
    requestId: 1,
    requestTitle: 'Lavoura',
    requestStatus: 'AWARDED',
    categoryName: 'Lavoura',
    island: 'Terceira',
    hasAssignment: false,
    hasCheckin: false,
  },
  {
    executionId: 2,
    requestId: 2,
    requestTitle: 'Limpeza',
    requestStatus: 'AWARDED',
    categoryName: 'Limpeza',
    island: 'São Miguel',
    hasAssignment: true,
    hasCheckin: false,
  },
  {
    executionId: 3,
    requestId: 3,
    requestTitle: 'Poda',
    requestStatus: 'IN_PROGRESS',
    categoryName: 'Jardinagem',
    island: 'Terceira',
    hasAssignment: true,
    hasCheckin: true,
  },
];

describe('ProviderJobsList', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows "Sem trabalhos ativos" when empty', () => {
    render(<ProviderJobsList jobs={[]} />);
    expect(screen.getByText('Sem trabalhos ativos')).toBeInTheDocument();
  });

  it('renders heading "Trabalhos Ativos"', () => {
    render(<ProviderJobsList jobs={mockJobs} />);
    expect(screen.getByText('Trabalhos Ativos')).toBeInTheDocument();
  });

  it('shows "Atribuir equipa" for AWARDED without assignment', () => {
    render(<ProviderJobsList jobs={[mockJobs[0]]} />);
    expect(screen.getByText('Atribuir equipa')).toBeInTheDocument();
  });

  it('shows "Fazer check-in" for AWARDED with assignment', () => {
    render(<ProviderJobsList jobs={[mockJobs[1]]} />);
    expect(screen.getByText('Fazer check-in')).toBeInTheDocument();
  });

  it('shows "Enviar fotos / Concluir" for IN_PROGRESS', () => {
    render(<ProviderJobsList jobs={[mockJobs[2]]} />);
    expect(screen.getByText('Enviar fotos / Concluir')).toBeInTheDocument();
  });

  it('renders request titles and category info', () => {
    render(<ProviderJobsList jobs={mockJobs} />);
    expect(screen.getByText('Lavoura')).toBeInTheDocument();
    expect(screen.getByText('Limpeza')).toBeInTheDocument();
    expect(screen.getByText('Poda')).toBeInTheDocument();
  });

  it('navigates to request detail on job click', () => {
    render(<ProviderJobsList jobs={mockJobs} />);
    const button = screen.getByText('Lavoura').closest('button');
    fireEvent.click(button!);
    expect(mockNavigate).toHaveBeenCalledWith('/requests/1');
  });
});
