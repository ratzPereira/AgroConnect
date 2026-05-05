import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ResetPassword } from '../ResetPassword';

/* ── Mocks ───────────────────────────────────────────────── */

const mockResetPassword = vi.fn();

vi.mock('@/api/auth', () => ({
  resetPassword: (...args: unknown[]) => mockResetPassword(...args),
}));

/* ── Tests ───────────────────────────────────────────────── */

describe('ResetPassword — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders password and confirm password fields when token present', () => {
    renderWithProviders(<ResetPassword />, { route: '/reset-password?token=valid123' });
    expect(screen.getByText('Nova Palavra-passe')).toBeInTheDocument();
    expect(screen.getByLabelText('Nova palavra-passe')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar palavra-passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Redefinir Palavra-passe/i })).toBeInTheDocument();
  });

  it('shows invalid link error when no token present', () => {
    renderWithProviders(<ResetPassword />, { route: '/reset-password' });
    expect(screen.getByText('Link Inválido')).toBeInTheDocument();
    expect(screen.getByText(/O link de redefinição é inválido/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Solicitar novo link/i });
    expect(link).toHaveAttribute('href', '/forgot-password');
  });

  it('shows success message after successful reset', async () => {
    mockResetPassword.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithProviders(<ResetPassword />, { route: '/reset-password?token=valid123' });

    await user.type(screen.getByLabelText('Nova palavra-passe'), 'newSecure123');
    await user.type(screen.getByLabelText('Confirmar palavra-passe'), 'newSecure123');
    await user.click(screen.getByRole('button', { name: /Redefinir Palavra-passe/i }));

    await waitFor(() => {
      expect(screen.getByText('Palavra-passe alterada com sucesso.')).toBeInTheDocument();
    });
    const loginLink = screen.getByRole('link', { name: /Iniciar Sessão/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('shows server error when reset fails', async () => {
    mockResetPassword.mockRejectedValue({
      response: {
        data: { message: 'Token expirado.' },
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<ResetPassword />, { route: '/reset-password?token=expired123' });

    await user.type(screen.getByLabelText('Nova palavra-passe'), 'newSecure123');
    await user.type(screen.getByLabelText('Confirmar palavra-passe'), 'newSecure123');
    await user.click(screen.getByRole('button', { name: /Redefinir Palavra-passe/i }));

    await waitFor(() => {
      expect(screen.getByText('Token expirado.')).toBeInTheDocument();
    });
  });

  it('shows generic connection error when non-axios error occurs', async () => {
    mockResetPassword.mockRejectedValue(new Error('Network failure'));
    const user = userEvent.setup();
    renderWithProviders(<ResetPassword />, { route: '/reset-password?token=valid123' });

    await user.type(screen.getByLabelText('Nova palavra-passe'), 'newSecure123');
    await user.type(screen.getByLabelText('Confirmar palavra-passe'), 'newSecure123');
    await user.click(screen.getByRole('button', { name: /Redefinir Palavra-passe/i }));

    await waitFor(() => {
      expect(screen.getByText('Não foi possível ligar ao servidor.')).toBeInTheDocument();
    });
  });
});
