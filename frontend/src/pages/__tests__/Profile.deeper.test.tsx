import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Profile } from '../Profile';

/* ── Mocks ───────────────────────────────────────────────── */

const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

let mockUser: Record<string, unknown> = {
  id: 2,
  name: 'Maria Silva',
  email: 'maria@test.pt',
  role: 'CLIENT',
};

vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    vi.fn((selector?: unknown) => {
      const state = {
        user: mockUser,
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        logout: mockLogout,
      };
      return typeof selector === 'function' ? (selector as (s: typeof state) => unknown)(state) : state;
    }),
    { getState: vi.fn(() => ({ logout: mockLogout })) },
  ),
}));

const mockGetMyProfile = vi.fn();
const mockIsProviderProfile = vi.fn();

vi.mock('@/api/profile', () => ({
  getMyProfile: (...args: unknown[]) => mockGetMyProfile(...args),
  updateClientProfile: vi.fn(() => Promise.resolve()),
  updateProviderProfile: vi.fn(() => Promise.resolve()),
  isProviderProfile: (...args: unknown[]) => mockIsProviderProfile(...args),
}));

const mockDeleteAccount = vi.fn();
const mockExportMyData = vi.fn();

vi.mock('@/api/account', () => ({
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
  exportMyData: (...args: unknown[]) => mockExportMyData(...args),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useBreadcrumbs', () => ({
  useBreadcrumbs: () => [],
}));

/* ── Tests ───────────────────────────────────────────────── */

describe('Profile — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 2, name: 'Maria Silva', email: 'maria@test.pt', role: 'CLIENT' };
    mockIsProviderProfile.mockReturnValue(false);
    mockGetMyProfile.mockResolvedValue({
      name: 'Maria Silva',
      phone: '+351 912 345 678',
      parish: 'Fajã de Baixo',
      municipality: 'Ponta Delgada',
      island: 'São Miguel',
    });
  });

  it('renders loading skeletons while profile is loading', () => {
    mockGetMyProfile.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<Profile />, { route: '/profile' });
    // While loading, profile data should not be visible and edit button should not appear
    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument();
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    // The heading should still be there
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('renders client profile with name, phone, location when loaded', async () => {
    renderWithProviders(<Profile />, { route: '/profile' });
    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });
    expect(screen.getByText('+351 912 345 678')).toBeInTheDocument();
    expect(screen.getByText(/Fajã de Baixo/)).toBeInTheDocument();
    expect(screen.getByText('maria@test.pt')).toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />, { route: '/profile' });
    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });
    const editButton = screen.getByText('Editar');
    await user.click(editButton);
    // In edit mode, should see Guardar and Cancelar buttons
    expect(screen.getByText('Guardar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('renders provider profile fields when user is provider', async () => {
    mockUser = { id: 3, name: 'AgroServiços', email: 'agro@test.pt', role: 'PROVIDER_MANAGER' };
    mockIsProviderProfile.mockReturnValue(true);
    mockGetMyProfile.mockResolvedValue({
      companyName: 'AgroServiços Lda',
      nif: '123456789',
      phone: '+351 919 999 999',
      parish: 'Arrifes',
      municipality: 'Ponta Delgada',
      island: 'São Miguel',
      description: 'Serviços de lavoura e pulverização.',
      serviceRadiusKm: 30,
    });

    renderWithProviders(<Profile />, { route: '/profile' });
    await waitFor(() => {
      expect(screen.getByText('AgroServiços Lda')).toBeInTheDocument();
    });
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('+351 919 999 999')).toBeInTheDocument();
    expect(screen.getByText('Serviços de lavoura e pulverização.')).toBeInTheDocument();
  });

  it('shows confirmation dialog for account deletion', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />, { route: '/profile' });
    await waitFor(() => {
      expect(screen.getByText('Eliminar conta')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Eliminar conta'));
    // The modal should appear with a password prompt
    await waitFor(() => {
      expect(screen.getByText('Eliminar definitivamente')).toBeInTheDocument();
    });
    expect(screen.getByText(/Esta acao e irreversivel/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Palavra-passe')).toBeInTheDocument();
  });

  it('shows error when trying to delete without password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />, { route: '/profile' });
    await waitFor(() => {
      expect(screen.getByText('Eliminar conta')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Eliminar conta'));
    await waitFor(() => {
      expect(screen.getByText('Eliminar definitivamente')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Eliminar definitivamente'));
    await waitFor(() => {
      expect(screen.getByText('Introduza a sua palavra-passe.')).toBeInTheDocument();
    });
  });

  it('shows fallback text when profile fails to load', async () => {
    mockGetMyProfile.mockResolvedValue(null);
    renderWithProviders(<Profile />, { route: '/profile' });
    await waitFor(() => {
      expect(screen.getByText('Nao foi possivel carregar os dados do perfil.')).toBeInTheDocument();
    });
  });
});
