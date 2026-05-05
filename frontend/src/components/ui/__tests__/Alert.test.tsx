import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from '../Alert';

describe('Alert', () => {
  it('renders with message', () => {
    render(<Alert>Something happened</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something happened')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(<Alert title="Attention">Details here</Alert>);
    expect(screen.getByText('Attention')).toBeInTheDocument();
    expect(screen.getByText('Details here')).toBeInTheDocument();
  });

  it('applies info variant styling by default', () => {
    render(<Alert>Info message</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-secondary-50');
    expect(alert.className).toContain('border-secondary-200');
  });

  it('applies success variant styling', () => {
    render(<Alert variant="success">Success</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-leaf-50');
    expect(alert.className).toContain('border-leaf-200');
  });

  it('applies warning variant styling', () => {
    render(<Alert variant="warning">Warning</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-warning-50');
  });

  it('applies danger variant styling', () => {
    render(<Alert variant="danger">Error</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-danger-50');
  });

  it('renders dismiss button when dismissible', () => {
    render(<Alert dismissible>Dismissible alert</Alert>);
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();
  });

  it('hides alert and calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    render(
      <Alert dismissible onDismiss={onDismiss}>
        Dismissible
      </Alert>,
    );
    fireEvent.click(screen.getByLabelText('Fechar'));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not render dismiss button when not dismissible', () => {
    render(<Alert>Not dismissible</Alert>);
    expect(screen.queryByLabelText('Fechar')).not.toBeInTheDocument();
  });
});
