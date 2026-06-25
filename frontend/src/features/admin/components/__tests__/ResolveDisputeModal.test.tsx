import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ResolveDisputeModal } from '../ResolveDisputeModal';
import { resolveDispute } from '@/api/requests';
import type { AdminDispute } from '@/types/admin';

vi.mock('@/api/requests', () => ({
  resolveDispute: vi.fn(() => Promise.resolve({})),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const dispute: AdminDispute = {
  requestId: 42,
  clientName: 'João Silva',
  providerName: 'AgroServiços',
  requestTitle: 'Lavoura de 2 ha',
  amount: 350,
  createdAt: '2026-06-20T10:00:00Z',
};

describe('ResolveDisputeModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the dispute details', () => {
    renderWithProviders(<ResolveDisputeModal open dispute={dispute} onClose={vi.fn()} />);
    expect(screen.getByText('Resolver disputa')).toBeInTheDocument();
    expect(screen.getByText('Lavoura de 2 ha')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('€350.00')).toBeInTheDocument();
  });

  it('keeps confirm disabled until a decision and notes are provided', () => {
    renderWithProviders(<ResolveDisputeModal open dispute={dispute} onClose={vi.fn()} />);
    const confirm = screen.getByRole('button', { name: /Confirmar resolução/i });
    expect(confirm).toBeDisabled();
  });

  it('resolves the dispute in favour of the provider (RELEASE)', async () => {
    const onClose = vi.fn();
    renderWithProviders(<ResolveDisputeModal open dispute={dispute} onClose={onClose} />);

    fireEvent.click(screen.getByText('A favor do prestador'));
    fireEvent.change(screen.getByLabelText(/Notas da resolução/i), {
      target: { value: 'Trabalho concluído conforme acordado.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar resolução/i }));

    await waitFor(() => {
      expect(resolveDispute).toHaveBeenCalledWith(42, {
        resolution: 'RELEASE',
        notes: 'Trabalho concluído conforme acordado.',
      });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('resolves the dispute in favour of the client (REFUND)', async () => {
    renderWithProviders(<ResolveDisputeModal open dispute={dispute} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('A favor do cliente'));
    fireEvent.change(screen.getByLabelText(/Notas da resolução/i), {
      target: { value: 'Serviço não prestado.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar resolução/i }));

    await waitFor(() => {
      expect(resolveDispute).toHaveBeenCalledWith(42, {
        resolution: 'REFUND',
        notes: 'Serviço não prestado.',
      });
    });
  });
});
