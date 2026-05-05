import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/utils';
import { Register } from '../Register';

/* ── Mocks ───────────────────────────────────────────────── */

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, variants: _v, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderRegister() {
  return renderWithProviders(<Register />, { route: '/register' });
}

/* ── Tests ───────────────────────────────────────────────── */

describe('Register — deeper coverage', () => {
  it('renders all form fields (name, email, password, confirm password)', () => {
    renderRegister();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Palavra-passe')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar palavra-passe')).toBeInTheDocument();
  });

  it('renders role selection with Agricultor and Prestador', () => {
    renderRegister();
    expect(screen.getByText('Agricultor')).toBeInTheDocument();
    expect(screen.getByText('Prestador')).toBeInTheDocument();
  });

  it('shows provider fields (company name, NIF) when Prestador is selected', async () => {
    const user = userEvent.setup();
    renderRegister();
    // Select the Prestador radio
    await user.click(screen.getByText('Prestador'));
    await waitFor(() => {
      expect(screen.getByLabelText('Nome da Empresa')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('NIF')).toBeInTheDocument();
  });

  it('shows link to login page', () => {
    renderRegister();
    const loginLink = screen.getByRole('link', { name: /entrar/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('shows terms and privacy links', () => {
    renderRegister();
    expect(screen.getByRole('link', { name: /Termos de Serviço/i })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: /Política de Privacidade/i })).toHaveAttribute('href', '/privacy');
  });

  it('renders back to landing link', () => {
    renderRegister();
    const backLink = screen.getByRole('link', { name: /Voltar ao início/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/landing');
  });

  it('renders submit button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
  });
});
