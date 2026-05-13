import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { InventoryItem } from '@/types/inventory';

const mockMutate = vi.fn();

let mockQueryReturn: { data: InventoryItem[] | undefined; isLoading: boolean };
let mockMutationReturn: {
  mutate: typeof mockMutate;
  isPending: boolean;
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => mockQueryReturn),
  useMutation: vi.fn((opts: unknown) => {
    const config = opts as { onSuccess?: () => void; onError?: (e: unknown) => void };
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
});
