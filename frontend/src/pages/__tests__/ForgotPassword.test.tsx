import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ForgotPassword } from '../ForgotPassword';

vi.mock('@/api/auth', () => ({
  forgotPassword: vi.fn(),
}));

describe('ForgotPassword', () => {
  it('renders forgot password form with heading', () => {
    renderWithProviders(<ForgotPassword />, { route: '/forgot-password' });
    expect(screen.getByText('Recuperar Palavra-passe')).toBeInTheDocument();
  });

  it('has email input field', () => {
    renderWithProviders(<ForgotPassword />, { route: '/forgot-password' });
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('has submit button', () => {
    renderWithProviders(<ForgotPassword />, { route: '/forgot-password' });
    expect(screen.getByRole('button', { name: /enviar link/i })).toBeInTheDocument();
  });
});
