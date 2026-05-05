import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobStatusChart } from '../JobStatusChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const mockData = [
  { name: 'Em progresso', value: 5, color: '#8b5cf6' },
  { name: 'Concluídos', value: 12, color: '#22c55e' },
  { name: 'Pendentes', value: 3, color: '#f59e0b' },
];

describe('JobStatusChart', () => {
  it('renders chart container with status data', () => {
    render(<JobStatusChart data={mockData} total={20} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('renders total count in center', () => {
    render(<JobStatusChart data={mockData} total={20} />);
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('shows empty state when all values are zero', () => {
    const emptyData = [
      { name: 'Em progresso', value: 0, color: '#8b5cf6' },
      { name: 'Concluídos', value: 0, color: '#22c55e' },
    ];
    render(<JobStatusChart data={emptyData} total={0} />);
    expect(screen.getByText('Sem dados disponíveis')).toBeInTheDocument();
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
  });

  it('renders pie and cell components', () => {
    render(<JobStatusChart data={mockData} total={20} />);
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    const cells = screen.getAllByTestId('cell');
    expect(cells).toHaveLength(3);
  });
});
