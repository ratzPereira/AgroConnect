import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import {
  listInventory,
  getLowStockItems,
  createInventoryItem,
} from '@/api/inventory';
import type { InventoryItem } from '@/types/inventory';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/illustrations/EmptyTransactions', () => ({
  EmptyTransactions: (props: Record<string, unknown>) => (
    <div data-testid="empty-transactions-illustration" {...props} />
  ),
}));

vi.mock('@/api/inventory', () => ({
  listInventory: vi.fn(),
  getLowStockItems: vi.fn(),
  createInventoryItem: vi.fn(),
}));

const normalItem: InventoryItem = {
  id: 1,
  productName: 'Fertilizante NPK',
  unit: 'KG',
  quantity: 50,
  minStockAlert: 10,
  costPerUnit: 2.5,
  lowStock: false,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-03-20T14:00:00Z',
};

const lowStockItem: InventoryItem = {
  id: 2,
  productName: 'Herbicida Glifosato',
  unit: 'L',
  quantity: 3,
  minStockAlert: 5,
  costPerUnit: 12.0,
  lowStock: true,
  createdAt: '2026-02-01T10:00:00Z',
  updatedAt: '2026-03-25T10:00:00Z',
};

const itemWithNulls: InventoryItem = {
  id: 3,
  productName: 'Sacos de ração',
  unit: 'UNIT',
  quantity: 20,
  minStockAlert: null,
  costPerUnit: null,
  lowStock: false,
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-03-01T10:00:00Z',
};

const allItems = [normalItem, lowStockItem, itemWithNulls];

async function renderInventoryPage() {
  const { Inventory } = await import('../Inventory');
  return renderWithProviders(<Inventory />, { route: '/provider/inventory' });
}

describe('Inventory Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  it('renders loading skeleton while data is being fetched', async () => {
    let resolveList: (value: InventoryItem[]) => void;
    (listInventory as Mock).mockReturnValue(
      new Promise<InventoryItem[]>((resolve) => { resolveList = resolve; }),
    );
    (getLowStockItems as Mock).mockResolvedValue([]);

    await renderInventoryPage();

    const skeletonTable = document.querySelector('.rounded-xl.border.overflow-hidden');
    expect(skeletonTable).toBeTruthy();

    resolveList!(allItems);
    await waitFor(() => {
      expect(screen.getByText('Fertilizante NPK')).toBeInTheDocument();
    });
  });

  it('renders empty state with correct text when no items exist', async () => {
    (listInventory as Mock).mockResolvedValue([]);
    (getLowStockItems as Mock).mockResolvedValue([]);

    await renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByText('Inventário vazio')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Adicione itens ao seu inventário para controlar stock e custos.'),
    ).toBeInTheDocument();
  });

  it('renders table with items showing product name, unit, quantity, and status', async () => {
    (listInventory as Mock).mockResolvedValue(allItems);
    (getLowStockItems as Mock).mockResolvedValue([lowStockItem]);

    await renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByText('Fertilizante NPK')).toBeInTheDocument();
    });

    expect(screen.getByText('Herbicida Glifosato')).toBeInTheDocument();
    expect(screen.getByText('Sacos de ração')).toBeInTheDocument();

    expect(screen.getByText('kg')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('un')).toBeInTheDocument();

    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('shows "Baixo" badge for low stock items and "OK" for normal items', async () => {
    (listInventory as Mock).mockResolvedValue(allItems);
    (getLowStockItems as Mock).mockResolvedValue([lowStockItem]);

    await renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByText('Fertilizante NPK')).toBeInTheDocument();
    });

    expect(screen.getByText('Baixo')).toBeInTheDocument();
    const okBadges = screen.getAllByText('OK');
    expect(okBadges).toHaveLength(2);
  });

  it('shows low stock alert banner when lowStock items exist', async () => {
    (listInventory as Mock).mockResolvedValue(allItems);
    (getLowStockItems as Mock).mockResolvedValue([lowStockItem]);

    await renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByText('Stock baixo')).toBeInTheDocument();
    });

    expect(screen.getByText('1 item com stock baixo')).toBeInTheDocument();
  });

  it('clicking "Adicionar" button shows the form', async () => {
    (listInventory as Mock).mockResolvedValue(allItems);
    (getLowStockItems as Mock).mockResolvedValue([]);
    const user = userEvent.setup();

    await renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByText('Fertilizante NPK')).toBeInTheDocument();
    });

    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Adicionar'),
    );
    expect(addButton).toBeDefined();
    await user.click(addButton!);

    expect(screen.getByPlaceholderText('Nome do produto')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Quantidade inicial')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Alerta mín. stock')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Custo inicial/unidade (€)')).toBeInTheDocument();
  });

  it('submitting the form calls createInventoryItem with correct data', async () => {
    (listInventory as Mock).mockResolvedValue([]);
    (getLowStockItems as Mock).mockResolvedValue([]);
    (createInventoryItem as Mock).mockResolvedValue({
      id: 10,
      productName: 'Adubo orgânico',
      unit: 'KG',
      quantity: 100,
      minStockAlert: null,
      costPerUnit: null,
      lowStock: false,
      createdAt: '2026-03-29T10:00:00Z',
      updatedAt: '2026-03-29T10:00:00Z',
    });
    const user = userEvent.setup();

    await renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByText('Inventário vazio')).toBeInTheDocument();
    });

    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Adicionar') && !btn.textContent?.includes('item'),
    );
    await user.click(addButton!);

    await user.type(screen.getByPlaceholderText('Nome do produto'), 'Adubo orgânico');
    await user.type(screen.getByPlaceholderText('Quantidade inicial'), '100');

    await user.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(createInventoryItem).toHaveBeenCalledWith({
        productName: 'Adubo orgânico',
        unit: 'KG',
        quantity: 100,
        minStockAlert: undefined,
        costPerUnit: undefined,
      });
    });
  });

  it('clicking "Cancelar" hides the form', async () => {
    (listInventory as Mock).mockResolvedValue(allItems);
    (getLowStockItems as Mock).mockResolvedValue([]);
    const user = userEvent.setup();

    await renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByText('Fertilizante NPK')).toBeInTheDocument();
    });

    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Adicionar'),
    );
    await user.click(addButton!);
    expect(screen.getByPlaceholderText('Nome do produto')).toBeInTheDocument();

    await user.click(screen.getByText('Cancelar'));
    expect(screen.queryByPlaceholderText('Nome do produto')).not.toBeInTheDocument();
  });

  it('clicking a row navigates to the item detail page', async () => {
    (listInventory as Mock).mockResolvedValue(allItems);
    (getLowStockItems as Mock).mockResolvedValue([]);
    const user = userEvent.setup();

    await renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByText('Fertilizante NPK')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    const firstDataRow = rows[1];
    await user.click(firstDataRow);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/provider/inventory/1');
    });
  });

  it('renders cost per unit and min stock alert or dash when null', async () => {
    (listInventory as Mock).mockResolvedValue(allItems);
    (getLowStockItems as Mock).mockResolvedValue([]);

    await renderInventoryPage();

    await waitFor(() => {
      expect(screen.getByText('Fertilizante NPK')).toBeInTheDocument();
    });

    expect(screen.getByText('€2.5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('€12')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
