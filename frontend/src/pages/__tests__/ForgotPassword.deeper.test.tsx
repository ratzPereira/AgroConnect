import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ForgotPassword } from '../ForgotPassword';

/* ── Mocks ───────────────────────────────────────────────── */

const mockForgotPassword = vi.fn();

vi.mock('@/api/auth', () => ({
  forgotPassword: (...args: unknown[]) => mockForgotPassword(...args),
}));

/* ── Tests ───────────────────────────────────────────────── */

describe('ForgotPassword — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title and instructions', () => {
    renderWithProviders(<ForgotPassword />, { route: '/forgot-password' });
    expect(screen.getByText('Recuperar Palavra-passe')).toBeInTheDocument();
    expect(screen.getByText(/Introduza o seu email/)).toBeInTheDocument();
  });

  it('renders email input and submit button', () => {
    renderWithProviders(<ForgotPassword />, { route: '/forgot-password' });
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar Link/i })).toBeInTheDocument();
  });

  it('shows success message after submitting email', async () => {
    mockForgotPassword.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithProviders(<ForgotPassword />, { route: '/forgot-password' });

    await user.type(screen.getByLabelText('Email'), 'maria@test.pt');
    await user.click(screen.getByRole('button', { name: /Enviar Link/i }));

    await waitFor(() => {
      expect(screen.getByText(/Se o email existir/)).toBeInTheDocument();
    });
    // After success, the form should be replaced with the success message
    expect(screen.queryByRole('button', { name: /Enviar Link/i })).not.toBeInTheDocument();
  });

  it('shows link back to login', () => {
    renderWithProviders(<ForgotPassword />, { route: '/forgot-password' });
    const loginLink = screen.getByRole('link', { name: /Voltar ao login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('shows error message when request fails', async () => {
    mockForgotPassword.mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();
    renderWithProviders(<ForgotPassword />, { route: '/forgot-password' });

    await user.type(screen.getByLabelText('Email'), 'bad@test.pt');
    await user.click(screen.getByRole('button', { name: /Enviar Link/i }));

    await waitFor(() => {
      expect(screen.getByText(/Não foi possível processar o pedido/)).toBeInTheDocument();
    });
  });
});
