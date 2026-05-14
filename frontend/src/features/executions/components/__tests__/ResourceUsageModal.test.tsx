import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { InventoryItem } from '@/types/inventory';

const mockMutate = vi.fn();

let mockQueryReturn: { data: InventoryItem[] | undefined; isLoading: boolean };
let mockMutationReturn: {
  mutate: typeof mockMutate;
  isPending: boolean;
};
const capturedMutationConfig: { current: { onSuccess?: () => void; onError?: (e: unknown) => void } } = {
  current: {},
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => mockQueryReturn),
  useMutation: vi.fn((opts: unknown) => {
    const config = opts as { onSuccess?: () => void; onError?: (e: unknown) => void };
    capturedMutationConfig.current = config;
    return {
      ...mockMutationReturn,
      mutate: (...args: unknown[]) => {
        mockMutate(...args);
        config.onSuccess?.();
      },
    };
  }),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

vi.mock('@/api/inventory', () => ({ listInventory: vi.fn() }));
vi.mock('@/api/jobCosting', () => ({ recordResourceUsage: vi.fn() }));

vi.mock('axios', () => ({
  default: {
    isAxiosError: (err: unknown): boolean =>
      typeof err === 'object' && err !== null && (err as { isAxiosError?: boolean }).isAxiosError === true,
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { ResourceUsageModal } from '../ResourceUsageModal';

const mockItems: InventoryItem[] = [
  {
    id: 1,
    productName: 'Adubo NPK',
    unit: 'KG',
    quantity: 100,
    minStockAlert: 10,
    costPerUnit: 2,
    lowStock: false,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  },
];

describe('ResourceUsageModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationReturn = { mutate: mockMutate, isPending: false };
    mockQueryReturn = { data: mockItems, isLoading: false };
  });

  it('renders modal title when open', () => {
    render(<ResourceUsageModal open={true} onClose={vi.fn()} executionId={1} requestId={10} />);
    expect(screen.getByText('Registar consumo de recurso')).toBeInTheDocument();
  });

  it('renders inventory options', () => {
    render(<ResourceUsageModal open={true} onClose={vi.fn()} executionId={1} requestId={10} />);
    expect(screen.getByText(/Adubo NPK/)).toBeInTheDocument();
    expect(screen.getByText(/100 kg em stock/)).toBeInTheDocument();
  });

  it('rejects submission when no item selected', () => {
    render(<ResourceUsageModal open={true} onClose={vi.fn()} executionId={1} requestId={10} />);
    const qtyInput = screen.getByLabelText(/Quantidade/);
    fireEvent.change(qtyInput, { target: { value: '5' } });
    const submitButton = screen.getByRole('button', { name: /Registar consumo/i });
    fireEvent.click(submitButton);
    expect(screen.getByText(/Seleccione um produto/)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('rejects submission when quantity exceeds stock', () => {
    render(<ResourceUsageModal open={true} onClose={vi.fn()} executionId={1} requestId={10} />);
    const select = screen.getByLabelText(/Produto/) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '1' } });
    const qtyInput = screen.getByLabelText(/Quantidade/);
    fireEvent.change(qtyInput, { target: { value: '999' } });
    fireEvent.click(screen.getByRole('button', { name: /Registar consumo/i }));
    expect(screen.getByText(/Stock insuficiente/)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits valid usage and calls onClose', () => {
    const onClose = vi.fn();
    render(<ResourceUsageModal open={true} onClose={onClose} executionId={1} requestId={10} />);
    const select = screen.getByLabelText(/Produto/) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '1' } });
    const qtyInput = screen.getByLabelText(/Quantidade/);
    fireEvent.change(qtyInput, { target: { value: '12.5' } });
    fireEvent.click(screen.getByRole('button', { name: /Registar consumo/i }));
    expect(mockMutate).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows empty-stock message when no inventory items exist', () => {
    mockQueryReturn = { data: [], isLoading: false };
    render(<ResourceUsageModal open={true} onClose={vi.fn()} executionId={1} requestId={10} />);
    expect(screen.getByText(/Sem itens no inventário/)).toBeInTheDocument();
  });

  it('renders the loading indicator while inventory is loading', () => {
    mockQueryReturn = { data: undefined, isLoading: true };
    render(<ResourceUsageModal open={true} onClose={vi.fn()} executionId={1} requestId={10} />);
    expect(screen.getByText(/A carregar inventário/)).toBeInTheDocument();
  });

  it('rejects a quantity of zero with a positive-number error', () => {
    render(<ResourceUsageModal open={true} onClose={vi.fn()} executionId={1} requestId={10} />);
    fireEvent.change(screen.getByLabelText(/Produto/), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Quantidade/), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /Registar consumo/i }));
    expect(screen.getByText(/maior que zero/)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancelar is pressed', () => {
    const onClose = vi.fn();
    render(<ResourceUsageModal open={true} onClose={onClose} executionId={1} requestId={10} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows 409 stock-insufficient message from server error', () => {
    render(<ResourceUsageModal open={true} onClose={vi.fn()} executionId={1} requestId={10} />);
    act(() => {
      capturedMutationConfig.current.onError?.({
        isAxiosError: true,
        response: { status: 409, data: { message: 'Sem stock disponível' } },
      });
    });
    expect(screen.getByText('Sem stock disponível')).toBeInTheDocument();
    act(() => {
      capturedMutationConfig.current.onError?.({
        isAxiosError: true,
        response: { status: 409 },
      });
    });
    expect(screen.getByText(/Stock insuficiente/)).toBeInTheDocument();
  });

  it('shows 400 invalid-data message from server error', () => {
    render(<ResourceUsageModal open={true} onClose={vi.fn()} executionId={1} requestId={10} />);
    act(() => {
      capturedMutationConfig.current.onError?.({
        isAxiosError: true,
        response: { status: 400 },
      });
    });
    expect(screen.getByText(/Dados inválidos/)).toBeInTheDocument();
  });

  it('shows generic error for non-axios errors', () => {
    render(<ResourceUsageModal open={true} onClose={vi.fn()} executionId={1} requestId={10} />);
    act(() => {
      capturedMutationConfig.current.onError?.(new Error('boom'));
    });
    expect(screen.getByText(/Erro ao registar consumo/)).toBeInTheDocument();
  });

  it('renders the costPerUnit segment when defined', () => {
    render(<ResourceUsageModal open={true} onClose={vi.fn()} executionId={1} requestId={10} />);
    expect(screen.getByText(/2\.0000 €\/kg/)).toBeInTheDocument();
  });
});
