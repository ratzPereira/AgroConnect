import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Profile } from '../Profile';
import axios from 'axios';

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
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    }),
    { getState: vi.fn(() => ({ logout: mockLogout })) },
  ),
}));

const mockGetMyProfile = vi.fn();
const mockUpdateClientProfile = vi.fn();
const mockUpdateProviderProfile = vi.fn();
const mockIsProviderProfile = vi.fn();

vi.mock('@/api/profile', () => ({
  getMyProfile: (...args: unknown[]) => mockGetMyProfile(...args),
  updateClientProfile: (...args: unknown[]) => mockUpdateClientProfile(...args),
  updateProviderProfile: (...args: unknown[]) => mockUpdateProviderProfile(...args),
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

/* ── Helpers ─────────────────────────────────────────────── */

const CLIENT_PROFILE = {
  id: 1,
  name: 'Maria Silva',
  phone: '+351 912 345 678',
  parish: 'Faja de Baixo',
  municipality: 'Ponta Delgada',
  island: 'Sao Miguel',
  latitude: 37.74,
  longitude: -25.68,
};

const PROVIDER_PROFILE = {
  id: 3,
  companyName: 'AgroServicos Lda',
  nif: '123456789',
  phone: '+351 919 999 999',
  parish: 'Arrifes',
  municipality: 'Ponta Delgada',
  island: 'Sao Miguel',
  description: 'Servicos de lavoura e pulverizacao.',
  serviceRadiusKm: 30,
  avgRating: 4.5,
  totalReviews: 12,
  verified: true,
  latitude: 37.75,
  longitude: -25.70,
  profileComplete: true,
};

/* ── Tests ───────────────────────────────────────────────── */

describe('Profile — deeper coverage 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 2, name: 'Maria Silva', email: 'maria@test.pt', role: 'CLIENT' };
    mockIsProviderProfile.mockReturnValue(false);
    mockGetMyProfile.mockResolvedValue({ ...CLIENT_PROFILE });
  });

  it('renders loading skeletons while profile query is pending', () => {
    mockGetMyProfile.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Profile />, { route: '/profile' });

    // Title always visible
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    // Profile data should not be visible
    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument();
    // Edit button should not appear during loading
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
  });

  it('renders client profile fields (Nome, Email, Telefone, Localizacao)', async () => {
    renderWithProviders(<Profile />, { route: '/profile' });

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('maria@test.pt')).toBeInTheDocument();
    expect(screen.getByText('Telefone')).toBeInTheDocument();
    expect(screen.getByText('+351 912 345 678')).toBeInTheDocument();
    expect(screen.getByText('Localizacao')).toBeInTheDocument();
    expect(screen.getByText('Faja de Baixo, Ponta Delgada, Sao Miguel')).toBeInTheDocument();
  });

  it('renders provider profile fields (Empresa, NIF, Email, Telefone, Localizacao)', async () => {
    mockUser = { id: 3, name: 'AgroServicos', email: 'agro@test.pt', role: 'PROVIDER_MANAGER' };
    mockIsProviderProfile.mockReturnValue(true);
    mockGetMyProfile.mockResolvedValue({ ...PROVIDER_PROFILE });

    renderWithProviders(<Profile />, { route: '/profile' });

    await waitFor(() => {
      expect(screen.getByText('AgroServicos Lda')).toBeInTheDocument();
    });
    expect(screen.getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByText('NIF')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('agro@test.pt')).toBeInTheDocument();
    expect(screen.getByText('Telefone')).toBeInTheDocument();
    expect(screen.getByText('+351 919 999 999')).toBeInTheDocument();
    expect(screen.getByText('Localizacao')).toBeInTheDocument();
    expect(screen.getByText('Arrifes, Ponta Delgada, Sao Miguel')).toBeInTheDocument();
  });

  it('shows description section for provider with description', async () => {
    mockUser = { id: 3, name: 'AgroServicos', email: 'agro@test.pt', role: 'PROVIDER_MANAGER' };
    mockIsProviderProfile.mockReturnValue(true);
    mockGetMyProfile.mockResolvedValue({ ...PROVIDER_PROFILE });

    renderWithProviders(<Profile />, { route: '/profile' });

    await waitFor(() => {
      expect(screen.getByText('AgroServicos Lda')).toBeInTheDocument();
    });
    expect(screen.getByText('Descricao')).toBeInTheDocument();
    expect(screen.getByText('Servicos de lavoura e pulverizacao.')).toBeInTheDocument();
  });

  it('click "Editar" shows client edit form with Guardar and Cancelar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />, { route: '/profile' });

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Editar'));
    expect(screen.getByText('Guardar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    // Should have Nome and Telefone labels with corresponding inputs (by display value)
    expect(screen.getByDisplayValue('Maria Silva')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+351 912 345 678')).toBeInTheDocument();
  });

  it('client edit form: save calls updateClientProfile', async () => {
    const user = userEvent.setup();
    mockUpdateClientProfile.mockResolvedValue({ ...CLIENT_PROFILE, name: 'Maria Updated' });

    renderWithProviders(<Profile />, { route: '/profile' });

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Editar'));

    const nameInput = screen.getByDisplayValue('Maria Silva');
    await user.clear(nameInput);
    await user.type(nameInput, 'Maria Updated');

    await user.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(mockUpdateClientProfile).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateClientProfile).toHaveBeenCalledWith({
      name: 'Maria Updated',
      phone: '+351 912 345 678',
    });
  });

  it('provider edit form: save calls updateProviderProfile', async () => {
    mockUser = { id: 3, name: 'AgroServicos', email: 'agro@test.pt', role: 'PROVIDER_MANAGER' };
    mockIsProviderProfile.mockReturnValue(true);
    mockGetMyProfile.mockResolvedValue({ ...PROVIDER_PROFILE });
    mockUpdateProviderProfile.mockResolvedValue({ ...PROVIDER_PROFILE });

    const user = userEvent.setup();
    renderWithProviders(<Profile />, { route: '/profile' });

    await waitFor(() => {
      expect(screen.getByText('AgroServicos Lda')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Editar'));

    // Should see provider-specific fields by their current values
    expect(screen.getByDisplayValue('AgroServicos Lda')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();

    await user.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(mockUpdateProviderProfile).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateProviderProfile).toHaveBeenCalledWith({
      companyName: 'AgroServicos Lda',
      nif: '123456789',
      phone: '+351 919 999 999',
      description: 'Servicos de lavoura e pulverizacao.',
      serviceRadiusKm: 30,
    });
  });

  it('cancel edit returns to view mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />, { route: '/profile' });

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Editar'));
    expect(screen.getByText('Guardar')).toBeInTheDocument();

    await user.click(screen.getByText('Cancelar'));

    // Back to view mode — Editar button should be visible again
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.queryByText('Guardar')).not.toBeInTheDocument();
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
  });

  it('export button calls exportMyData', async () => {
    const user = userEvent.setup();
    mockExportMyData.mockResolvedValue(undefined);

    renderWithProviders(<Profile />, { route: '/profile' });

    await waitFor(() => {
      expect(screen.getByText('Exportar os meus dados')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Exportar os meus dados'));

    await waitFor(() => {
      expect(mockExportMyData).toHaveBeenCalledTimes(1);
    });
  });

  it('delete modal opens on "Eliminar conta" click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />, { route: '/profile' });

    await waitFor(() => {
      expect(screen.getByText('Eliminar conta')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Eliminar conta'));

    await waitFor(() => {
      expect(screen.getByText('Eliminar definitivamente')).toBeInTheDocument();
    });
    expect(screen.getByText(/Esta acao e irreversivel/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Palavra-passe')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirme a sua palavra-passe')).toBeInTheDocument();
  });

  it('delete validates empty password and shows error', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />, { route: '/profile' });

    await waitFor(() => {
      expect(screen.getByText('Eliminar conta')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Eliminar conta'));

    await waitFor(() => {
      expect(screen.getByText('Eliminar definitivamente')).toBeInTheDocument();
    });

    // Submit without typing a password
    await user.click(screen.getByText('Eliminar definitivamente'));

    await waitFor(() => {
      expect(screen.getByText('Introduza a sua palavra-passe.')).toBeInTheDocument();
    });
    // deleteAccount should NOT have been called
    expect(mockDeleteAccount).not.toHaveBeenCalled();
  });

  it('delete with correct password calls deleteAccount, logout, and navigates to /', async () => {
    const user = userEvent.setup();
    mockDeleteAccount.mockResolvedValue(undefined);

    renderWithProviders(<Profile />, { route: '/profile' });

    await waitFor(() => {
      expect(screen.getByText('Eliminar conta')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Eliminar conta'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Palavra-passe')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Palavra-passe'), 'mypassword123');
    await user.click(screen.getByText('Eliminar definitivamente'));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledWith('mypassword123');
    });
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('delete with wrong password (400) shows "Palavra-passe incorreta."', async () => {
    const user = userEvent.setup();

    // Simulate Axios 400 error
    const axiosError = new Error('Bad Request');
    Object.assign(axiosError, {
      isAxiosError: true,
      response: { status: 400 },
    });
    // Ensure axios.isAxiosError returns true for this error
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
    mockDeleteAccount.mockRejectedValue(axiosError);

    renderWithProviders(<Profile />, { route: '/profile' });

    await waitFor(() => {
      expect(screen.getByText('Eliminar conta')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Eliminar conta'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Palavra-passe')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Palavra-passe'), 'wrongpassword');
    await user.click(screen.getByText('Eliminar definitivamente'));

    await waitFor(() => {
      expect(screen.getByText('Palavra-passe incorreta.')).toBeInTheDocument();
    });
    // Should NOT logout or navigate
    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
