import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationPanel } from '../ConfirmationPanel';

const mockConfirmMutate = vi.fn();
const mockDisputeMutate = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn((opts: { mutationFn: unknown }) => {
    // Distinguish confirm vs dispute by checking if mutationFn takes arguments
    const fnStr = String(opts.mutationFn);
    const isDispute = fnStr.includes('reason') || fnStr.includes('disputeRequest');
    return {
      mutate: isDispute ? mockDisputeMutate : mockConfirmMutate,
      isPending: false,
      isError: false,
    };
  }),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

vi.mock('@/api/requests', () => ({
  confirmRequest: vi.fn(),
  disputeRequest: vi.fn(),
}));

describe('ConfirmationPanel', () => {
  it('renders confirmation heading and description', () => {
    render(<ConfirmationPanel requestId={1} />);
    expect(screen.getByText('Confirma\u00e7\u00e3o do Servi\u00e7o')).toBeInTheDocument();
    expect(
      screen.getByText(/prestador marcou o servi\u00e7o como conclu\u00eddo/i),
    ).toBeInTheDocument();
  });

  it('shows confirm and dispute buttons', () => {
    render(<ConfirmationPanel requestId={1} />);
    expect(screen.getByRole('button', { name: /confirmar conclus\u00e3o/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /abrir disputa/i })).toBeInTheDocument();
  });

  it('shows dispute form when "Abrir Disputa" is clicked', () => {
    render(<ConfirmationPanel requestId={1} />);
    fireEvent.click(screen.getByRole('button', { name: /abrir disputa/i }));
    expect(screen.getByLabelText(/motivo da disputa/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submeter disputa/i })).toBeInTheDocument();
  });

  it('shows error when dispute reason is too short', () => {
    render(<ConfirmationPanel requestId={1} />);
    fireEvent.click(screen.getByRole('button', { name: /abrir disputa/i }));

    // Type a reason that is less than 10 characters
    const textarea = screen.getByLabelText(/motivo da disputa/i);
    fireEvent.change(textarea, { target: { value: 'curto' } });

    fireEvent.click(screen.getByRole('button', { name: /submeter disputa/i }));
    expect(screen.getByText(/motivo deve ter pelo menos 10 caracteres/i)).toBeInTheDocument();
  });

  it('hides dispute form when cancel is clicked', () => {
    render(<ConfirmationPanel requestId={1} />);
    // Open dispute form
    fireEvent.click(screen.getByRole('button', { name: /abrir disputa/i }));
    expect(screen.getByLabelText(/motivo da disputa/i)).toBeInTheDocument();

    // Cancel
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByLabelText(/motivo da disputa/i)).not.toBeInTheDocument();
    // Original buttons should be back
    expect(screen.getByRole('button', { name: /confirmar conclus\u00e3o/i })).toBeInTheDocument();
  });
});
