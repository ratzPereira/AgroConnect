import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditListingModal } from '../EditListingModal';
import type { Listing } from '@/types/listing';

const mockUpdateListing = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockSetQueryData = vi.fn();
let mockMutationConfig: {
  mutationFn?: (data: unknown) => Promise<unknown>;
  onSuccess?: (result: unknown) => void;
  onError?: (err: unknown) => void;
} = {};
const mockMutate = vi.fn();

vi.mock('@/api/listings', () => ({
  updateListing: (...args: unknown[]) => mockUpdateListing(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn((config: typeof mockMutationConfig) => {
    mockMutationConfig = config;
    return {
      mutate: (data: unknown) => {
        mockMutate(data);
        // Simulate the mutation flow so onSuccess fires for tests that need it
        const result = config.mutationFn?.(data);
        if (result instanceof Promise) {
          result.then((r) => config.onSuccess?.(r)).catch((e) => config.onError?.(e));
        }
      },
      isPending: false,
    };
  }),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
    setQueryData: mockSetQueryData,
  })),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className, role, ...props }: Record<string, unknown>) => (
      <div className={className as string} role={role as string} {...(props as object)}>
        {children as React.ReactNode}
      </div>
    ),
  },
}));

const baseListing: Listing = {
  id: 19,
  title: 'Sementes de tomate',
  description: 'Sementes biológicas de tomate coração de boi.',
  price: 1,
  priceNegotiable: true,
  category: 'SEEDS',
  condition: null,
  quantity: 45,
  unit: 'un',
  latitude: 38.6667,
  longitude: -27.2167,
  locationName: 'Quinta da Ribeira',
  parish: 'São Mateus',
  municipality: 'Angra do Heroísmo',
  island: 'Terceira',
  status: 'ACTIVE',
  viewsCount: 12,
  sellerId: 5,
  sellerName: 'João Silva',
  sellerRating: null,
  sellerListingCount: 1,
  photoUrls: [],
  favoriteCount: 0,
  favorited: false,
  createdAt: '2026-05-21T10:00:00Z',
  updatedAt: '2026-05-21T10:00:00Z',
  expiresAt: null,
};

describe('EditListingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateListing.mockResolvedValue({ ...baseListing, title: 'Updated' });
  });

  it('pre-fills the form with the current listing values', () => {
    render(<EditListingModal open={true} onClose={vi.fn()} listing={baseListing} />);

    expect(screen.getByLabelText('Título')).toHaveValue('Sementes de tomate');
    expect(screen.getByLabelText('Descrição')).toHaveValue('Sementes biológicas de tomate coração de boi.');
    expect(screen.getByLabelText('Preço (EUR)')).toHaveValue(1);
    expect(screen.getByLabelText('Preço negociável')).toBeChecked();
    expect(screen.getByLabelText('Quantidade')).toHaveValue(45);
    expect(screen.getByLabelText('Nome da localização (opcional)')).toHaveValue('Quinta da Ribeira');
  });

  it('does not render when open is false', () => {
    render(<EditListingModal open={false} onClose={vi.fn()} listing={baseListing} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('disables submit button until a field changes', () => {
    render(<EditListingModal open={true} onClose={vi.fn()} listing={baseListing} />);
    expect(screen.getByRole('button', { name: /Guardar Alterações/i })).toBeDisabled();
  });

  it('submits an UpdateListingDto when the user edits the price and saves', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EditListingModal open={true} onClose={onClose} listing={baseListing} />);

    const priceInput = screen.getByLabelText('Preço (EUR)');
    await user.clear(priceInput);
    await user.type(priceInput, '2.5');

    await user.click(screen.getByRole('button', { name: /Guardar Alterações/i }));

    await waitFor(() => {
      expect(mockUpdateListing).toHaveBeenCalledWith(
        19,
        expect.objectContaining({
          title: 'Sementes de tomate',
          price: 2.5,
          priceNegotiable: true,
          quantity: 45,
          unit: 'un',
        }),
      );
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Anúncio atualizado');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('rejects invalid prices via validation', async () => {
    const user = userEvent.setup();
    render(<EditListingModal open={true} onClose={vi.fn()} listing={baseListing} />);

    const priceInput = screen.getByLabelText('Preço (EUR)');
    await user.clear(priceInput);
    await user.type(priceInput, '-5');

    await user.click(screen.getByRole('button', { name: /Guardar Alterações/i }));

    await waitFor(() => {
      expect(screen.getByText(/Preço deve ser zero ou positivo/i)).toBeInTheDocument();
    });
    expect(mockUpdateListing).not.toHaveBeenCalled();
  });

  it('sends price as null when the field is cleared', async () => {
    const user = userEvent.setup();
    render(<EditListingModal open={true} onClose={vi.fn()} listing={baseListing} />);

    await user.clear(screen.getByLabelText('Preço (EUR)'));
    await user.click(screen.getByRole('button', { name: /Guardar Alterações/i }));

    await waitFor(() => {
      expect(mockUpdateListing).toHaveBeenCalledWith(
        19,
        expect.objectContaining({ price: null }),
      );
    });
  });

  it('shows the condition field only for EQUIPMENT category', () => {
    const equipmentListing: Listing = { ...baseListing, category: 'EQUIPMENT', condition: 'USED' };
    const { unmount } = render(
      <EditListingModal open={true} onClose={vi.fn()} listing={equipmentListing} />,
    );
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.queryByLabelText('Quantidade')).not.toBeInTheDocument();
    unmount();

    render(<EditListingModal open={true} onClose={vi.fn()} listing={baseListing} />);
    expect(screen.queryByText('Estado')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Quantidade')).toBeInTheDocument();
  });
});
