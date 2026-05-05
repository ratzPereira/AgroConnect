import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevenueChart } from '../RevenueChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const mockData = [
  { label: 'Jan', value: 1200 },
  { label: 'Fev', value: 1500 },
  { label: 'Mar', value: 1800 },
  { label: 'Abr', value: 2100 },
];

describe('RevenueChart', () => {
  it('renders chart container with data', () => {
    render(<RevenueChart data={mockData} />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('renders area and axis components', () => {
    render(<RevenueChart data={mockData} />);
    expect(screen.getByTestId('area')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
  });

  it('shows insufficient data message when fewer than 2 data points', () => {
    render(<RevenueChart data={[{ label: 'Jan', value: 100 }]} />);
    expect(screen.getByText('Dados insuficientes para o gráfico')).toBeInTheDocument();
  });

  it('does not show chart when data is insufficient', () => {
    render(<RevenueChart data={[]} />);
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    expect(screen.getByText('Dados insuficientes para o gráfico')).toBeInTheDocument();
  });
});
