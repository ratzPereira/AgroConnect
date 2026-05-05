import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Register } from '../Register';

/* ── Mocks ───────────────────────────────────────────────── */

const mockRegisterApi = vi.fn();

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, variants: _v, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/api/auth', () => ({
  register: (...args: unknown[]) => mockRegisterApi(...args),
}));

/* ── Helpers ─────────────────────────────────────────────── */

function renderRegister() {
  return renderWithProviders(<Register />, { route: '/register' });
}

/* ── Tests ───────────────────────────────────────────────── */

describe('Register — deeper2 coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with all base fields (name, email, password, confirm password)', () => {
    renderRegister();

    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Palavra-passe')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar palavra-passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
  });

  it('CLIENT role (Agricultor) is selected by default', () => {
    renderRegister();

    // CLIENT radio should be checked
    const clientRadio = screen.getByDisplayValue('CLIENT') as HTMLInputElement;
    expect(clientRadio.checked).toBe(true);

    // PROVIDER_MANAGER radio should not be checked
    const providerRadio = screen.getByDisplayValue('PROVIDER_MANAGER') as HTMLInputElement;
    expect(providerRadio.checked).toBe(false);
  });

  it('switching to PROVIDER_MANAGER shows company and NIF fields', async () => {
    const user = userEvent.setup();
    renderRegister();

    // Provider fields should not be visible by default
    expect(screen.queryByLabelText('Nome da Empresa')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('NIF')).not.toBeInTheDocument();

    // Click on the Prestador radio label
    await user.click(screen.getByText('Prestador'));

    await waitFor(() => {
      expect(screen.getByLabelText('Nome da Empresa')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('NIF')).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    renderRegister();

    // Submit without filling anything
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText('O nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
    });
    expect(screen.getByText('O email é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('A palavra-passe deve ter pelo menos 8 caracteres')).toBeInTheDocument();
    expect(screen.getByText('Confirme a palavra-passe')).toBeInTheDocument();
  });

  it('shows mismatch error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText('Nome'), 'João Silva');
    await user.type(screen.getByLabelText('Email'), 'joao@test.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'password123');
    await user.type(screen.getByLabelText('Confirmar palavra-passe'), 'different123');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText('As palavras-passe não coincidem')).toBeInTheDocument();
    });
  });

  it('successful registration shows success screen with "Verifique o seu email"', async () => {
    const user = userEvent.setup();
    mockRegisterApi.mockResolvedValue({ message: 'Conta criada com sucesso.' });

    renderRegister();

    await user.type(screen.getByLabelText('Nome'), 'João Silva');
    await user.type(screen.getByLabelText('Email'), 'joao@test.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'password123');
    await user.type(screen.getByLabelText('Confirmar palavra-passe'), 'password123');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText('Verifique o seu email')).toBeInTheDocument();
    });
    expect(screen.getByText(/Enviámos um link de verificação/)).toBeInTheDocument();
  });

  it('success screen has "Ir para o login" link pointing to /login', async () => {
    const user = userEvent.setup();
    mockRegisterApi.mockResolvedValue({ message: 'OK' });

    renderRegister();

    await user.type(screen.getByLabelText('Nome'), 'Ana Costa');
    await user.type(screen.getByLabelText('Email'), 'ana@test.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'securepass1');
    await user.type(screen.getByLabelText('Confirmar palavra-passe'), 'securepass1');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText('Verifique o seu email')).toBeInTheDocument();
    });

    const loginLink = screen.getByRole('link', { name: /Ir para o login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('error 409 shows "Este email já está registado."', async () => {
    const user = userEvent.setup();
    mockRegisterApi.mockRejectedValue({
      response: { status: 409, data: { message: 'Conflict' } },
    });

    renderRegister();

    await user.type(screen.getByLabelText('Nome'), 'Pedro Santos');
    await user.type(screen.getByLabelText('Email'), 'existing@test.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'password123');
    await user.type(screen.getByLabelText('Confirmar palavra-passe'), 'password123');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText('Este email já está registado.')).toBeInTheDocument();
    });
  });

  it('generic server error shows message from response', async () => {
    const user = userEvent.setup();
    mockRegisterApi.mockRejectedValue({
      response: { status: 500, data: { message: 'Erro interno do servidor.' } },
    });

    renderRegister();

    await user.type(screen.getByLabelText('Nome'), 'Maria Lima');
    await user.type(screen.getByLabelText('Email'), 'maria@test.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'password123');
    await user.type(screen.getByLabelText('Confirmar palavra-passe'), 'password123');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText('Erro interno do servidor.')).toBeInTheDocument();
    });
  });

  it('network error shows "Não foi possível ligar ao servidor."', async () => {
    const user = userEvent.setup();
    // Simulate a network error (no response property)
    mockRegisterApi.mockRejectedValue(new Error('Network Error'));

    renderRegister();

    await user.type(screen.getByLabelText('Nome'), 'Carlos Sousa');
    await user.type(screen.getByLabelText('Email'), 'carlos@test.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'password123');
    await user.type(screen.getByLabelText('Confirmar palavra-passe'), 'password123');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText('Não foi possível ligar ao servidor.')).toBeInTheDocument();
    });
  });

  it('has "Já tem conta?" text with link to /login', () => {
    renderRegister();

    expect(screen.getByText(/Já tem conta/)).toBeInTheDocument();
    const loginLink = screen.getByRole('link', { name: /Entrar/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
