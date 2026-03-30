import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Login } from '../Login';

/* ── Mocks ───────────────────────────────────────────────── */

const mockNavigate = vi.fn();
const mockLoginApi = vi.fn();
const mockSetTokens = vi.fn();
const mockSetUser = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, transition: _t, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
}));

vi.mock('@/api/auth', () => ({
  login: (...args: unknown[]) => mockLoginApi(...args),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    setTokens: mockSetTokens,
    setUser: mockSetUser,
  }),
}));

/* ── Helpers ─────────────────────────────────────────────── */

function renderLogin() {
  return renderWithProviders(<Login />, { route: '/login' });
}

/* ── Tests ───────────────────────────────────────────────── */

describe('Login — deeper2 coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with email and password fields', () => {
    renderLogin();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Palavra-passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    renderLogin();

    // Fill only password, leave email empty
    await user.type(screen.getByLabelText('Palavra-passe'), 'somepassword');
    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('O email é obrigatório')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty password', async () => {
    const user = userEvent.setup();
    renderLogin();

    // Fill only email, leave password empty
    await user.type(screen.getByLabelText('Email'), 'joao@test.pt');
    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('A palavra-passe é obrigatória')).toBeInTheDocument();
    });
  });

  it('successful login calls setTokens, setUser, and navigates to /dashboard', async () => {
    const user = userEvent.setup();
    const mockUser = { id: 1, email: 'joao@test.pt', name: 'João', role: 'CLIENT' };
    mockLoginApi.mockResolvedValue({
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
      expiresIn: 900,
      user: mockUser,
    });

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'joao@test.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'password123');
    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(mockSetTokens).toHaveBeenCalledWith('access-token-123', 'refresh-token-456');
    });
    expect(mockSetUser).toHaveBeenCalledWith(mockUser);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('error 401 shows "Email ou palavra-passe incorretos."', async () => {
    const user = userEvent.setup();
    mockLoginApi.mockRejectedValue({
      response: { status: 401, data: { message: 'Unauthorized' } },
    });

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'joao@test.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Email ou palavra-passe incorretos.')).toBeInTheDocument();
    });
  });

  it('error 403 shows email verification message', async () => {
    const user = userEvent.setup();
    mockLoginApi.mockRejectedValue({
      response: { status: 403, data: { message: 'Verifique o seu email antes de iniciar sessão.' } },
    });

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'unverified@test.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'password123');
    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Verifique o seu email antes de iniciar sessão.')).toBeInTheDocument();
    });
  });

  it('generic server error shows message from response', async () => {
    const user = userEvent.setup();
    mockLoginApi.mockRejectedValue({
      response: { status: 500, data: { message: 'Erro interno do servidor.' } },
    });

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'joao@test.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'password123');
    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Erro interno do servidor.')).toBeInTheDocument();
    });
  });

  it('network error shows "Não foi possível ligar ao servidor."', async () => {
    const user = userEvent.setup();
    // Simulate network error (no response property)
    mockLoginApi.mockRejectedValue(new Error('Network Error'));

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'joao@test.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'password123');
    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Não foi possível ligar ao servidor.')).toBeInTheDocument();
    });
  });

  it('has links to register, forgot password, and landing pages', () => {
    renderLogin();

    // Forgot password link
    const forgotLink = screen.getByRole('link', { name: /Esqueceu a palavra-passe/i });
    expect(forgotLink).toHaveAttribute('href', '/forgot-password');

    // Register link
    const registerLink = screen.getByRole('link', { name: /Criar conta/i });
    expect(registerLink).toHaveAttribute('href', '/register');

    // Back to landing link
    const landingLink = screen.getByRole('link', { name: /Voltar ao início/i });
    expect(landingLink).toHaveAttribute('href', '/landing');
  });
});
