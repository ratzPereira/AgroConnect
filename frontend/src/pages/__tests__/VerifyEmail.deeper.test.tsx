import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { VerifyEmail } from '../VerifyEmail';

/* ── Mocks ───────────────────────────────────────────────── */

const mockVerifyEmail = vi.fn();

vi.mock('@/api/auth', () => ({
  verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
}));

/* ── Helpers ─────────────────────────────────────────────── */

function renderVerifyEmail(route: string) {
  return renderWithProviders(<VerifyEmail />, { route });
}

/* ── Tests ───────────────────────────────────────────────── */

describe('VerifyEmail — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockVerifyEmail.mockReturnValue(new Promise(() => {})); // never resolves
    renderVerifyEmail('/verify-email?token=abc123');
    expect(screen.getByText('A verificar o seu email...')).toBeInTheDocument();
  });

  it('renders success state when verified', async () => {
    mockVerifyEmail.mockResolvedValue({
      message: 'Email verificado com sucesso!',
    });

    renderVerifyEmail('/verify-email?token=valid-token');
    await waitFor(() => {
      expect(screen.getByText('Email Verificado')).toBeInTheDocument();
    });
    expect(screen.getByText('Email verificado com sucesso!')).toBeInTheDocument();
    // Login link after success
    const loginLink = screen.getByRole('link', { name: /Iniciar Sessão/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('renders error state when token is invalid', async () => {
    mockVerifyEmail.mockRejectedValue({
      response: {
        data: { message: 'Token expirado ou inválido.' },
      },
    });

    renderVerifyEmail('/verify-email?token=bad-token');
    await waitFor(() => {
      expect(screen.getByText('Erro na Verificação')).toBeInTheDocument();
    });
    expect(screen.getByText('Token expirado ou inválido.')).toBeInTheDocument();
    const loginLink = screen.getByRole('link', { name: /Voltar ao login/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('shows error when no token is present in URL', async () => {
    renderVerifyEmail('/verify-email');
    await waitFor(() => {
      expect(screen.getByText('Erro na Verificação')).toBeInTheDocument();
    });
    expect(screen.getByText('Token de verificação em falta.')).toBeInTheDocument();
  });

  it('shows generic error when server returns non-axios error', async () => {
    mockVerifyEmail.mockRejectedValue(new Error('Network error'));

    renderVerifyEmail('/verify-email?token=some-token');
    await waitFor(() => {
      expect(screen.getByText('Erro na Verificação')).toBeInTheDocument();
    });
    expect(screen.getByText('Não foi possível verificar o email.')).toBeInTheDocument();
  });
});
