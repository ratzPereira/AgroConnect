import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/utils';
import { Login } from '../Login';

/* ── Mocks ───────────────────────────────────────────────── */

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    setTokens: vi.fn(),
    setUser: vi.fn(),
  })),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, transition: _t, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderLogin() {
  return renderWithProviders(<Login />, { route: '/login' });
}

/* ── Tests ───────────────────────────────────────────────── */

describe('Login — deeper coverage', () => {
  it('renders forgot password link', () => {
    renderLogin();
    const link = screen.getByRole('link', { name: /Esqueceu a palavra-passe/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/forgot-password');
  });

  it('renders register link with correct href', () => {
    renderLogin();
    const link = screen.getByRole('link', { name: /criar conta/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/register');
  });

  it('renders page title and subtitle', () => {
    renderLogin();
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
    expect(screen.getByText(/Introduza as suas credenciais/)).toBeInTheDocument();
  });

  it('renders back to landing link', () => {
    renderLogin();
    const link = screen.getByRole('link', { name: /Voltar ao início/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/landing');
  });

  it('renders email field with placeholder', () => {
    renderLogin();
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('placeholder', 'joao@example.pt');
  });

  it('renders password field with placeholder', () => {
    renderLogin();
    const pwInput = screen.getByLabelText('Palavra-passe');
    expect(pwInput).toBeInTheDocument();
    expect(pwInput).toHaveAttribute('type', 'password');
  });
});
