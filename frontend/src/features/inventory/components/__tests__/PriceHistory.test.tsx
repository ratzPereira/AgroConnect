import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { listMovements } from '@/api/inventory';
import type { InventoryMovement, MovementsPage } from '@/types/inventory';
import { PriceHistory } from '../PriceHistory';

vi.mock('@/api/inventory', () => ({
  listMovements: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="rc-container">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="rc-area-chart">{children}</div>,
  Area: () => <div data-testid="rc-area" />,
  CartesianGrid: () => <div data-testid="rc-grid" />,
  XAxis: () => <div data-testid="rc-x" />,
  YAxis: () => <div data-testid="rc-y" />,
  Tooltip: () => <div data-testid="rc-tooltip" />,
  ReferenceLine: () => <div data-testid="rc-ref" />,
}));

function makeMovement(overrides: Partial<InventoryMovement>): InventoryMovement {
  return {
    id: 1,
    movementType: 'PURCHASE',
    quantityDelta: 100,
    unitCost: 1.0,
    quantityAfter: 100,
    wacAfter: 1.0,
    reason: null,
    executionId: null,
    actorUserId: null,
    actorName: null,
    createdAt: '2026-04-01T10:00:00Z',
    ...overrides,
  };
}

function makePage(content: InventoryMovement[]): MovementsPage {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 200,
    first: true,
    last: true,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PriceHistory', () => {
  it('shows loading skeleton initially', () => {
    (listMovements as Mock).mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders(<PriceHistory itemId={5} unit="L" currentWac={1.2} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows empty state when no movements with unit cost', async () => {
    (listMovements as Mock).mockResolvedValue(makePage([
      makeMovement({ id: 1, movementType: 'CONSUMPTION', unitCost: null, quantityDelta: -10 }),
    ]));
    renderWithProviders(<PriceHistory itemId={5} unit="L" currentWac={1.2} />);
    await waitFor(() => {
      expect(screen.getByText('Ainda não há histórico de preços')).toBeInTheDocument();
    });
  });

  it('renders single-purchase notice when only one price point', async () => {
    (listMovements as Mock).mockResolvedValue(makePage([
      makeMovement({ id: 1, movementType: 'PURCHASE', unitCost: 1.5, quantityDelta: 100 }),
    ]));
    renderWithProviders(<PriceHistory itemId={5} unit="L" currentWac={1.5} />);
    await waitFor(() => {
      expect(screen.getByText(/Apenas uma compra registada/)).toBeInTheDocument();
    });
  });

  it('renders chart and summary tiles when multiple purchases exist', async () => {
    (listMovements as Mock).mockResolvedValue(makePage([
      makeMovement({ id: 1, movementType: 'INITIAL', unitCost: 1.0, quantityDelta: 100, createdAt: '2026-03-01T10:00:00Z' }),
      makeMovement({ id: 2, movementType: 'PURCHASE', unitCost: 1.2, quantityDelta: 50, createdAt: '2026-04-01T10:00:00Z', reason: 'Repsol' }),
      makeMovement({ id: 3, movementType: 'PURCHASE', unitCost: 1.5, quantityDelta: 80, createdAt: '2026-05-01T10:00:00Z' }),
    ]));
    renderWithProviders(<PriceHistory itemId={5} unit="L" currentWac={1.25} />);

    await waitFor(() => {
      expect(screen.getByText('Histórico de preços')).toBeInTheDocument();
    });

    expect(screen.getByTestId('rc-area-chart')).toBeInTheDocument();
    const latestTile = screen.getByText('Último preço').parentElement;
    expect(latestTile?.textContent).toContain('€1.5000');
    const wacTile = screen.getByText('Preço médio (WAC)').parentElement;
    expect(wacTile?.textContent).toContain('€1.2500');
    const minTile = screen.getByText('Mais barato').parentElement;
    expect(minTile?.textContent).toContain('€1.0000');
    expect(screen.getByText('Repsol')).toBeInTheDocument();
  });

  it('shows positive trend badge when latest price is higher than first', async () => {
    (listMovements as Mock).mockResolvedValue(makePage([
      makeMovement({ id: 1, movementType: 'PURCHASE', unitCost: 1.0, createdAt: '2026-03-01T10:00:00Z' }),
      makeMovement({ id: 2, movementType: 'PURCHASE', unitCost: 1.5, createdAt: '2026-05-01T10:00:00Z' }),
    ]));
    renderWithProviders(<PriceHistory itemId={5} unit="L" currentWac={1.25} />);
    await waitFor(() => {
      expect(screen.getByText(/desde a primeira compra/)).toBeInTheDocument();
    });
    expect(screen.getByText(/\+50\.0%/)).toBeInTheDocument();
  });

  it('shows negative trend when latest price is lower than first', async () => {
    (listMovements as Mock).mockResolvedValue(makePage([
      makeMovement({ id: 1, movementType: 'PURCHASE', unitCost: 2.0, createdAt: '2026-03-01T10:00:00Z' }),
      makeMovement({ id: 2, movementType: 'PURCHASE', unitCost: 1.0, createdAt: '2026-05-01T10:00:00Z' }),
    ]));
    renderWithProviders(<PriceHistory itemId={5} unit="L" currentWac={1.5} />);
    await waitFor(() => {
      expect(screen.getByText(/-50\.0%/)).toBeInTheDocument();
    });
  });

  it('renders purchase rows in reverse-chronological order with price diff badges', async () => {
    (listMovements as Mock).mockResolvedValue(makePage([
      makeMovement({ id: 1, movementType: 'PURCHASE', unitCost: 1.0, quantityDelta: 100, createdAt: '2026-03-01T10:00:00Z' }),
      makeMovement({ id: 2, movementType: 'PURCHASE', unitCost: 1.2, quantityDelta: 50, createdAt: '2026-05-01T10:00:00Z' }),
    ]));
    renderWithProviders(<PriceHistory itemId={5} unit="L" currentWac={1.07} />);
    await waitFor(() => {
      expect(screen.getByText('Compras registadas')).toBeInTheDocument();
    });
    expect(screen.getByText(/\+€0\.2000/)).toBeInTheDocument();
  });

  it('renders total accumulated spend in footer', async () => {
    (listMovements as Mock).mockResolvedValue(makePage([
      makeMovement({ id: 1, movementType: 'PURCHASE', unitCost: 1.0, quantityDelta: 100, createdAt: '2026-03-01T10:00:00Z' }),
      makeMovement({ id: 2, movementType: 'PURCHASE', unitCost: 2.0, quantityDelta: 50, createdAt: '2026-05-01T10:00:00Z' }),
    ]));
    renderWithProviders(<PriceHistory itemId={5} unit="L" currentWac={1.33} />);
    await waitFor(() => {
      expect(screen.getByText('Total acumulado')).toBeInTheDocument();
    });
    expect(screen.getByText('€200.00')).toBeInTheDocument();
  });

  it('handles missing currentWac (null) by showing dash', async () => {
    (listMovements as Mock).mockResolvedValue(makePage([
      makeMovement({ id: 1, movementType: 'PURCHASE', unitCost: 1.0, createdAt: '2026-03-01T10:00:00Z' }),
      makeMovement({ id: 2, movementType: 'PURCHASE', unitCost: 1.2, createdAt: '2026-05-01T10:00:00Z' }),
    ]));
    renderWithProviders(<PriceHistory itemId={5} unit="L" currentWac={null} />);
    await waitFor(() => {
      expect(screen.getByText('Preço médio (WAC)')).toBeInTheDocument();
    });
    const wacTile = screen.getByText('Preço médio (WAC)').parentElement;
    expect(wacTile?.textContent).toContain('—');
  });
});
