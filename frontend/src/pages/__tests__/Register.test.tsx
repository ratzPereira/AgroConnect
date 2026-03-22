import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/utils';
import { Register } from '../Register';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderRegister() {
  return renderWithProviders(<Register />, { route: '/register' });
}

describe('Register', () => {
  it('renders name, email, and password fields', () => {
    renderRegister();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Palavra-passe')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar palavra-passe')).toBeInTheDocument();
  });

  it('renders role selection with Agricultor and Prestador options', () => {
    renderRegister();
    expect(screen.getByText('Tipo de conta')).toBeInTheDocument();
    expect(screen.getByText('Agricultor')).toBeInTheDocument();
    expect(screen.getByText('Prestador')).toBeInTheDocument();
  });

  it('renders submit button with text Registar', () => {
    renderRegister();
    const submitButton = screen.getByRole('button', { name: /registar/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('shows validation errors for empty submit', async () => {
    const user = userEvent.setup();
    renderRegister();

    // Clear default name field which is empty but required
    const submitButton = screen.getByRole('button', { name: /registar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('O nome deve ter pelo menos 2 caracteres'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('O email é obrigatório')).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    renderRegister();
    const loginLink = screen.getByRole('link', { name: /entrar/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
