import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { VerifyEmail } from '../VerifyEmail';

vi.mock('@/api/auth', () => ({
  verifyEmail: vi.fn(() => new Promise(() => {})),
}));

describe('VerifyEmail', () => {
  it('renders verification page', () => {
    renderWithProviders(<VerifyEmail />, { route: '/verify-email?token=abc123' });
    expect(screen.getByAltText('AgroConnect')).toBeInTheDocument();
  });

  it('shows loading state initially when token is present', () => {
    renderWithProviders(<VerifyEmail />, { route: '/verify-email?token=abc123' });
    expect(screen.getByText('A verificar o seu email...')).toBeInTheDocument();
  });
});
