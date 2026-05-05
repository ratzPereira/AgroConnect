import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/utils';
import { Login } from '../Login';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    setTokens: vi.fn(),
    setUser: vi.fn(),
  })),
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderLogin() {
  return renderWithProviders(<Login />, { route: '/login' });
}

describe('Login', () => {
  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Palavra-passe')).toBeInTheDocument();
  });

  it('renders submit button with text Entrar', () => {
    renderLogin();
    const buttons = screen.getAllByText('Entrar');
    // One is the heading, one is the button
    const submitButton = buttons.find(
      (el) => el.tagName === 'BUTTON' || el.closest('button'),
    );
    expect(submitButton).toBeDefined();
  });

  it('shows validation errors for empty submit', async () => {
    const user = userEvent.setup();
    renderLogin();
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('O email é obrigatório')).toBeInTheDocument();
    });
    expect(screen.getByText('A palavra-passe é obrigatória')).toBeInTheDocument();
  });

  it('shows error on invalid credentials (401)', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json(
          { message: 'Email ou palavra-passe incorretos.' },
          { status: 401 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText('Email'), 'bad@test.pt');
    await user.type(screen.getByLabelText('Palavra-passe'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => {
      expect(
        screen.getByText('Email ou palavra-passe incorretos.'),
      ).toBeInTheDocument();
    });
  });

  it('renders link to register page', () => {
    renderLogin();
    const registerLink = screen.getByRole('link', { name: /criar conta/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});
