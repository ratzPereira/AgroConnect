import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateProposalModal } from '../CreateProposalModal';

describe('CreateProposalModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    loading: false,
  };

  it('returns null when not open', () => {
    const { container } = render(
      <CreateProposalModal {...defaultProps} open={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with heading when open', () => {
    render(<CreateProposalModal {...defaultProps} />);
    expect(screen.getByText('Submeter Proposta')).toBeInTheDocument();
  });

  it('renders all required input fields', () => {
    render(<CreateProposalModal {...defaultProps} />);
    expect(screen.getByLabelText(/Pre\u00e7o total/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descri\u00e7\u00e3o da proposta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/O que inclui/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/O que exclui/i)).toBeInTheDocument();
  });

  it('shows submit and cancel buttons', () => {
    render(<CreateProposalModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /submeter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<CreateProposalModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
