import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardStatCards } from '../DashboardStatCards';

// Mock StatCard to simplify testing and avoid recharts dependency
vi.mock('@/components/ui/StatCard', () => ({
  StatCard: ({ label, value, prefix, suffix }: { label: string; value: number; prefix?: string; suffix?: string }) => (
    <div data-testid={`stat-${label}`}>
      <span>{label}</span>
      <span>{prefix}{value}{suffix}</span>
    </div>
  ),
}));

const mockStats = [
  { label: 'Pedidos', value: 12 },
  { label: 'Receita', value: 2450, prefix: '\u20AC' },
  { label: 'Avaliação', value: 4.7, suffix: '/5', decimals: 1 },
  { label: 'Concluídos', value: 8, trend: 15 },
];

describe('DashboardStatCards', () => {
  it('renders stat cards for each stat', () => {
    render(<DashboardStatCards stats={mockStats} />);
    expect(screen.getByTestId('stat-Pedidos')).toBeInTheDocument();
    expect(screen.getByTestId('stat-Receita')).toBeInTheDocument();
    expect(screen.getByTestId('stat-Avaliação')).toBeInTheDocument();
    expect(screen.getByTestId('stat-Concluídos')).toBeInTheDocument();
  });

  it('displays correct values', () => {
    render(<DashboardStatCards stats={mockStats} />);
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Receita')).toBeInTheDocument();
  });

  it('applies custom className to container', () => {
    const { container } = render(
      <DashboardStatCards stats={mockStats} className="mt-6" />,
    );
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('mt-6');
    expect(grid.className).toContain('grid');
  });

  it('renders correct grid layout', () => {
    const { container } = render(<DashboardStatCards stats={mockStats} />);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-4');
  });
});
