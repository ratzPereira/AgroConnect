import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Profile } from '../Profile';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    vi.fn((selector?: unknown) => {
      const state = {
        user: { id: 2, name: 'Maria Silva', email: 'maria@test.pt', role: 'CLIENT' },
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        logout: vi.fn(),
      };
      return typeof selector === 'function' ? (selector as (s: typeof state) => unknown)(state) : state;
    }),
    { getState: vi.fn(() => ({ logout: vi.fn() })) },
  ),
}));

vi.mock('@/api/profile', () => ({
  getMyProfile: vi.fn(() =>
    Promise.resolve({
      name: 'Maria Silva',
      phone: '+351 912 345 678',
      parish: 'Fajã de Baixo',
      municipality: 'Ponta Delgada',
      island: 'São Miguel',
    }),
  ),
  updateClientProfile: vi.fn(),
  updateProviderProfile: vi.fn(),
  isProviderProfile: vi.fn(() => false),
}));

vi.mock('@/api/account', () => ({
  deleteAccount: vi.fn(),
  exportMyData: vi.fn(),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useBreadcrumbs', () => ({
  useBreadcrumbs: () => [],
}));

describe('Profile', () => {
  it('renders profile page title', () => {
    renderWithProviders(<Profile />, { route: '/profile' });
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('shows user profile data when loaded', async () => {
    renderWithProviders(<Profile />, { route: '/profile' });
    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });
  });

  it('shows GDPR section with export and delete buttons', async () => {
    renderWithProviders(<Profile />, { route: '/profile' });
    await waitFor(() => {
      expect(screen.getByText('Dados Pessoais e Privacidade')).toBeInTheDocument();
    });
    expect(screen.getByText('Exportar os meus dados')).toBeInTheDocument();
    expect(screen.getByText('Eliminar conta')).toBeInTheDocument();
  });
});
