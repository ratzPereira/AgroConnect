import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MonthlyBreakdown } from '@/api/finance';
import { DashboardRevenueChart } from '../DashboardRevenueChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  Line: () => <div data-testid="line" />,
  CartesianGrid: () => <div data-testid="grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

function makeBreakdown(year: number, fill: (m: number) => Partial<MonthlyBreakdown['months'][number]> = () => ({})): MonthlyBreakdown {
  return {
    year,
    months: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
      payouts: 0,
      materialsCost: 0,
      laborCost: 0,
      machineExpenses: 0,
      netProfit: 0,
      completedJobs: 0,
      ...fill(i + 1),
    })),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 4, 14));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DashboardRevenueChart', () => {
  it('renders header with year from breakdown', () => {
    const breakdown = makeBreakdown(2026, () => ({ revenue: 100 }));
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByText(/Receita e lucro · 2026/)).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading is true', () => {
    const { container } = render(<DashboardRevenueChart breakdown={undefined} isLoading />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows empty state when all months have zero revenue and profit', () => {
    const breakdown = makeBreakdown(2026);
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByText(/Sem receitas registadas/)).toBeInTheDocument();
    expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument();
  });

  it('renders chart when data has values', () => {
    const breakdown = makeBreakdown(2026, (m) => ({ revenue: m * 100, netProfit: m * 40 }));
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar')).toBeInTheDocument();
    expect(screen.getByTestId('area')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toBeInTheDocument();
  });

  it('computes YTD totals from monthly breakdown', () => {
    const breakdown = makeBreakdown(2026, () => ({ revenue: 100, netProfit: 40, completedJobs: 1 }));
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByText(/Receita YTD/)).toBeInTheDocument();
    const tile = screen.getByText(/Receita YTD/).parentElement;
    expect(tile?.textContent).toMatch(/1\D?200\s*€/);
    expect(screen.getByText(/Trabalhos concluídos/)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows month-over-month delta for current year', () => {
    const breakdown = makeBreakdown(2026, (m) => {
      if (m === 4) return { revenue: 100 };
      if (m === 5) return { revenue: 150 };
      return {};
    });
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByText(/Este mês/)).toBeInTheDocument();
    expect(screen.getByText(/50\.0%/)).toBeInTheDocument();
  });

  it('renders best-month summary tile when revenue exists', () => {
    const breakdown = makeBreakdown(2026, (m) => ({ revenue: m === 7 ? 999 : 100 }));
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByText(/Melhor mês/)).toBeInTheDocument();
    expect(screen.getByText(/Jul/)).toBeInTheDocument();
  });
});
