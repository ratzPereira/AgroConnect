import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MonthlyBreakdown } from '@/api/finance';
import { DashboardRevenueChart } from '../DashboardRevenueChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
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
    const breakdown = makeBreakdown(2026, () => ({ revenue: 100, payouts: 90 }));
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByText(/Receita e lucro · 2026/)).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading is true', () => {
    const { container } = render(<DashboardRevenueChart breakdown={undefined} isLoading />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows empty state when all months have zero revenue and zero costs', () => {
    const breakdown = makeBreakdown(2026);
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByText(/Sem receitas registadas/)).toBeInTheDocument();
    expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument();
  });

  it('renders chart with stacked bars and revenue line when data has values', () => {
    const breakdown = makeBreakdown(2026, (m) => ({
      revenue: m * 100,
      payouts: m * 88,
      laborCost: m * 30,
      machineExpenses: m * 20,
      netProfit: m * 38,
    }));
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('bar').length).toBeGreaterThanOrEqual(4);
    expect(screen.getByTestId('line')).toBeInTheDocument();
  });

  it('renders YTD anatomy section with revenue total', () => {
    const breakdown = makeBreakdown(2026, () => ({
      revenue: 100,
      payouts: 88,
      laborCost: 30,
      machineExpenses: 20,
      netProfit: 38,
      completedJobs: 1,
    }));
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByText(/Anatomia da receita YTD/)).toBeInTheDocument();
    const anatomySection = screen.getByText(/Anatomia da receita YTD/).parentElement?.parentElement;
    expect(anatomySection?.textContent).toMatch(/1\D?200\s*€/);
  });

  it('shows all four cost category rows in anatomy section', () => {
    const breakdown = makeBreakdown(2026, () => ({ revenue: 100, payouts: 88, laborCost: 30, machineExpenses: 20, netProfit: 38 }));
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByText('Comissão plataforma')).toBeInTheDocument();
    expect(screen.getByText('Materiais')).toBeInTheDocument();
    expect(screen.getByText('Mão-de-obra')).toBeInTheDocument();
    expect(screen.getByText('Manutenção e despesas de máquinas')).toBeInTheDocument();
  });

  it('shows positive lucro and margin when costs are below payouts', () => {
    const breakdown = makeBreakdown(2026, () => ({
      revenue: 1000,
      payouts: 880,
      laborCost: 200,
      machineExpenses: 100,
      netProfit: 580,
    }));
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByText(/Lucro líquido/)).toBeInTheDocument();
    expect(screen.getByText(/margem 58\.0%/i)).toBeInTheDocument();
  });

  it('shows negative lucro with warning when costs exceed payouts', () => {
    const breakdown = makeBreakdown(2026, () => ({
      revenue: 1000,
      payouts: 880,
      laborCost: 600,
      machineExpenses: 500,
      netProfit: -220,
    }));
    render(<DashboardRevenueChart breakdown={breakdown} />);
    const lucroLabel = screen.getByText(/Lucro líquido/);
    const lucroSection = lucroLabel.closest('div')?.parentElement;
    expect(lucroSection?.textContent).toMatch(/-2\D?640\s*€/);
    expect(screen.getByText(/margem -22\.0%/i)).toBeInTheDocument();
  });

  it('shows jobs count and best month when revenue exists', () => {
    const breakdown = makeBreakdown(2026, (m) => ({
      revenue: m === 7 ? 999 : 100,
      payouts: m === 7 ? 880 : 90,
      completedJobs: 2,
      netProfit: 10,
    }));
    render(<DashboardRevenueChart breakdown={breakdown} />);
    expect(screen.getByText(/24 trabalhos concluídos/)).toBeInTheDocument();
    expect(screen.getByText(/Jul/)).toBeInTheDocument();
  });
});
