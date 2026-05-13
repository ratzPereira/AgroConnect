import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import {
  getInventoryItem,
  listMovements,
  recordPurchase,
  recordAdjustmentIn,
  recordAdjustmentOut,
  deleteInventoryItem,
  updateInventoryItem,
} from '@/api/inventory';
import type { InventoryItem, MovementsPage } from '@/types/inventory';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: '42' }),
  };
});

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/api/inventory', () => ({
  getInventoryItem: vi.fn(),
  listMovements: vi.fn(),
  recordPurchase: vi.fn(),
  recordAdjustmentIn: vi.fn(),
  recordAdjustmentOut: vi.fn(),
  deleteInventoryItem: vi.fn(),
  updateInventoryItem: vi.fn(),
}));

const item: InventoryItem = {
  id: 42,
  productName: 'Gasóleo agrícola',
  unit: 'L',
  quantity: 500,
  minStockAlert: 50,
  costPerUnit: 1.45,
  lowStock: false,
  createdAt: '2026-04-01T10:00:00Z',
  updatedAt: '2026-04-10T10:00:00Z',
};

const emptyMovements: MovementsPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 10,
  first: true,
  last: true,
};

const movementsPage: MovementsPage = {
  content: [
    {
      id: 200,
      movementType: 'PURCHASE',
      quantityDelta: 100,
      unitCost: 2,
      quantityAfter: 600,
      wacAfter: 1.5417,
      reason: 'Repsol',
      executionId: null,
      actorUserId: 7,
      actorName: 'Inv Provider',
      createdAt: '2026-04-12T09:00:00Z',
    },
    {
      id: 201,
      movementType: 'INITIAL',
      quantityDelta: 500,
      unitCost: 1.45,
      quantityAfter: 500,
      wacAfter: 1.45,
      reason: null,
      executionId: null,
      actorUserId: 7,
      actorName: 'Inv Provider',
      createdAt: '2026-04-01T10:00:00Z',
    },
  ],
  totalElements: 2,
  totalPages: 1,
  number: 0,
  size: 10,
  first: true,
  last: true,
};

async function renderDetailPage() {
  const { InventoryDetail } = await import('../InventoryDetail');
  return renderWithProviders(<InventoryDetail />, { route: '/provider/inventory/42' });
}

describe('InventoryDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    (getInventoryItem as Mock).mockResolvedValue(item);
    (listMovements as Mock).mockResolvedValue(movementsPage);
  });

  it('renders item header with name, unit, stock and WAC', async () => {
    await renderDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Gasóleo agrícola')).toBeInTheDocument();
    });

    expect(screen.getByText('Unidade: L')).toBeInTheDocument();
    expect(screen.getByText('500 L')).toBeInTheDocument();
    // €1.45 appears in both the WAC stat card and the INITIAL movement row
    expect(screen.getAllByText('€1.45').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('50 L')).toBeInTheDocument();
  });

  it('renders movement timeline rows', async () => {
    await renderDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Compra')).toBeInTheDocument();
    });

    expect(screen.getByText('Stock inicial')).toBeInTheDocument();
    expect(screen.getByText('Repsol')).toBeInTheDocument();
    expect(screen.getByText('+100 L')).toBeInTheDocument();
    expect(screen.getByText('+500 L')).toBeInTheDocument();
  });

  it('shows empty-state message when there are no movements', async () => {
    (listMovements as Mock).mockResolvedValue(emptyMovements);

    await renderDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Sem movimentos registados.')).toBeInTheDocument();
    });
  });

  it('"Registar compra" opens modal and submits purchase', async () => {
    (recordPurchase as Mock).mockResolvedValue({ id: 999 });
    const user = userEvent.setup();
    await renderDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Gasóleo agrícola')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Registar compra/i }));

    const dialog = await screen.findByRole('dialog');
    const qty = dialog.querySelector('input[name="quantity"]') as HTMLInputElement;
    const cost = dialog.querySelector('input[name="unitCost"]') as HTMLInputElement;
    const reason = dialog.querySelector('input[name="reason"]') as HTMLInputElement;
    await user.type(qty, '100');
    await user.type(cost, '2');
    await user.type(reason, 'Repsol');
    const submit = dialog.querySelector('button[type="submit"]') as HTMLButtonElement;
    await user.click(submit);

    await waitFor(() => {
      expect(recordPurchase).toHaveBeenCalledWith(42, {
        quantity: 100,
        unitCost: 2,
        reason: 'Repsol',
      });
    });
  });

  it('"Adicionar stock" submits adjustment-in with optional unit cost', async () => {
    (recordAdjustmentIn as Mock).mockResolvedValue({ id: 998 });
    const user = userEvent.setup();
    await renderDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Gasóleo agrícola')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Adicionar stock/i }));

    const dialog = await screen.findByRole('dialog');
    const qty = dialog.querySelector('input[name="quantity"]') as HTMLInputElement;
    const reason = dialog.querySelector('input[name="reason"]') as HTMLInputElement;
    await user.type(qty, '20');
    await user.type(reason, 'Stock encontrado');
    const submit = dialog.querySelector('button[type="submit"]') as HTMLButtonElement;
    await user.click(submit);

    await waitFor(() => {
      expect(recordAdjustmentIn).toHaveBeenCalledWith(42, {
        quantity: 20,
        unitCost: undefined,
        reason: 'Stock encontrado',
      });
    });
  });

  it('"Retirar stock" submits adjustment-out', async () => {
    (recordAdjustmentOut as Mock).mockResolvedValue({ id: 997 });
    const user = userEvent.setup();
    await renderDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Gasóleo agrícola')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Retirar stock/i }));

    const dialog = await screen.findByRole('dialog');
    const qty = dialog.querySelector('input[name="quantity"]') as HTMLInputElement;
    const reason = dialog.querySelector('input[name="reason"]') as HTMLInputElement;
    await user.type(qty, '5');
    await user.type(reason, 'Estragado');
    const submitBtn = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Retirar',
    ) as HTMLButtonElement;
    await user.click(submitBtn);

    await waitFor(() => {
      expect(recordAdjustmentOut).toHaveBeenCalledWith(42, {
        quantity: 5,
        reason: 'Estragado',
      });
    });
  });

  it('"Eliminar" confirms then calls deleteInventoryItem and navigates back', async () => {
    (deleteInventoryItem as Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Gasóleo agrícola')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Eliminar/i }));

    const dialog = await screen.findByRole('dialog');
    const confirm = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Eliminar',
    ) as HTMLButtonElement;
    await user.click(confirm);

    await waitFor(() => {
      expect(deleteInventoryItem).toHaveBeenCalledWith(42);
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/provider/inventory');
    });
  });

  it('"Editar" submits rename with new product name and cleared alert', async () => {
    (updateInventoryItem as Mock).mockResolvedValue({ ...item, productName: 'Gasóleo verde', minStockAlert: null });
    const user = userEvent.setup();
    await renderDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Gasóleo agrícola')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Editar/i }));

    const dialog = await screen.findByRole('dialog');
    const nameInput = dialog.querySelector('input[name="productName"]') as HTMLInputElement;
    const alertInput = dialog.querySelector('input[name="minStockAlert"]') as HTMLInputElement;

    await user.clear(nameInput);
    await user.type(nameInput, 'Gasóleo verde');
    await user.clear(alertInput);

    const submit = dialog.querySelector('button[type="submit"]') as HTMLButtonElement;
    await user.click(submit);

    await waitFor(() => {
      expect(updateInventoryItem).toHaveBeenCalledWith(42, {
        productName: 'Gasóleo verde',
        minStockAlert: null,
      });
    });
  });

  it('"Voltar ao inventário" navigates back to list', async () => {
    const user = userEvent.setup();
    await renderDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Gasóleo agrícola')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Voltar ao inventário/i }));

    expect(navigateMock).toHaveBeenCalledWith('/provider/inventory');
  });

  it('shows lowStock warning banner when item is below threshold', async () => {
    (getInventoryItem as Mock).mockResolvedValue({ ...item, lowStock: true, quantity: 30 });
    await renderDetailPage();

    await waitFor(() => {
      expect(screen.getByText(/A quantidade atual está abaixo do alerta mínimo/)).toBeInTheDocument();
    });
  });
});
