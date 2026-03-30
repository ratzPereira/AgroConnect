import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ResetPassword } from '../ResetPassword';

vi.mock('@/api/auth', () => ({
  resetPassword: vi.fn(),
}));

describe('ResetPassword', () => {
  it('renders reset password form when token is present', () => {
    renderWithProviders(<ResetPassword />, { route: '/reset-password?token=abc123' });
    expect(screen.getByText('Nova Palavra-passe')).toBeInTheDocument();
  });

  it('has password input fields when token is present', () => {
    renderWithProviders(<ResetPassword />, { route: '/reset-password?token=abc123' });
    expect(screen.getByLabelText('Nova palavra-passe')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar palavra-passe')).toBeInTheDocument();
  });

  it('has submit button when token is present', () => {
    renderWithProviders(<ResetPassword />, { route: '/reset-password?token=abc123' });
    expect(screen.getByRole('button', { name: /redefinir palavra-passe/i })).toBeInTheDocument();
  });
});
