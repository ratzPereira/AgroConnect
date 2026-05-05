import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { AdminUsers } from '../Users';

/* ── Mocks ───────────────────────────────────────────────── */

const mockListUsers = vi.fn();
const mockBanUser = vi.fn();
const mockUnbanUser = vi.fn();

vi.mock('@/api/admin', () => ({
  listUsers: (...args: unknown[]) => mockListUsers(...args),
  banUser: (...args: unknown[]) => mockBanUser(...args),
  unbanUser: (...args: unknown[]) => mockUnbanUser(...args),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, loading, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    size?: string;
    variant?: string;
  }) => (
    <button onClick={onClick} disabled={disabled || loading} {...props}>
      {children}
    </button>
  ),
}));

/* ── Test data ───────────────────────────────────────────── */

const activeClient = {
  id: 1,
  name: 'Maria Santos',
  email: 'maria@test.pt',
  role: 'CLIENT' as const,
  active: true,
  requestCount: 5,
  proposalCount: 0,
  createdAt: '2026-01-15T10:00:00Z',
};

const bannedProvider = {
  id: 2,
  name: 'Carlos Ferreira',
  email: 'carlos@test.pt',
  role: 'PROVIDER_MANAGER' as const,
  active: false,
  requestCount: 0,
  proposalCount: 12,
  createdAt: '2025-11-20T08:30:00Z',
};

const adminUser = {
  id: 3,
  name: 'Admin Silva',
  email: 'admin@test.pt',
  role: 'ADMIN' as const,
  active: true,
  requestCount: 0,
  proposalCount: 0,
  createdAt: '2025-06-01T00:00:00Z',
};

const singlePageData = {
  content: [activeClient, bannedProvider, adminUser],
  totalPages: 1,
  totalElements: 3,
  number: 0,
  size: 20,
  first: true,
  last: true,
};

const multiPageData = {
  content: [activeClient],
  totalPages: 3,
  totalElements: 50,
  number: 0,
  size: 20,
  first: true,
  last: false,
};

/* ── Tests ───────────────────────────────────────────────── */

describe('AdminUsers — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title "Utilizadores"', () => {
    mockListUsers.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AdminUsers />, { route: '/admin/users' });
    expect(screen.getByText('Utilizadores')).toBeInTheDocument();
  });

  it('renders loading state with spinner in table', () => {
    mockListUsers.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AdminUsers />, { route: '/admin/users' });
    // The loading state renders a Loader2 spinner — check for the animate-spin element
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders user rows with name, email, and role label', async () => {
    mockListUsers.mockResolvedValue(singlePageData);
    renderWithProviders(<AdminUsers />, { route: '/admin/users' });

    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    expect(screen.getByText('maria@test.pt')).toBeInTheDocument();
    expect(screen.getByText('Cliente')).toBeInTheDocument();

    expect(screen.getByText('Carlos Ferreira')).toBeInTheDocument();
    expect(screen.getByText('carlos@test.pt')).toBeInTheDocument();
    expect(screen.getByText('Prestador')).toBeInTheDocument();

    expect(screen.getByText('Admin Silva')).toBeInTheDocument();
    expect(screen.getByText('admin@test.pt')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('shows "Ativo" badge for active users', async () => {
    mockListUsers.mockResolvedValue(singlePageData);
    renderWithProviders(<AdminUsers />, { route: '/admin/users' });

    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    // Two active users (activeClient + adminUser) should show "Ativo"
    const ativoBadges = screen.getAllByText('Ativo');
    expect(ativoBadges).toHaveLength(2);
  });

  it('shows "Banido" badge for banned users', async () => {
    mockListUsers.mockResolvedValue(singlePageData);
    renderWithProviders(<AdminUsers />, { route: '/admin/users' });

    await waitFor(() => {
      expect(screen.getByText('Carlos Ferreira')).toBeInTheDocument();
    });

    expect(screen.getByText('Banido')).toBeInTheDocument();
  });

  it('shows "Banir" button for active users', async () => {
    mockListUsers.mockResolvedValue(singlePageData);
    renderWithProviders(<AdminUsers />, { route: '/admin/users' });

    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    // Two active users should have "Banir" buttons
    const banirButtons = screen.getAllByText('Banir');
    expect(banirButtons).toHaveLength(2);
  });

  it('shows "Desbanir" button for banned users', async () => {
    mockListUsers.mockResolvedValue(singlePageData);
    renderWithProviders(<AdminUsers />, { route: '/admin/users' });

    await waitFor(() => {
      expect(screen.getByText('Carlos Ferreira')).toBeInTheDocument();
    });

    expect(screen.getByText('Desbanir')).toBeInTheDocument();
  });

  it('clicking "Banir" calls banUser with user id', async () => {
    const user = userEvent.setup();
    mockBanUser.mockResolvedValue(undefined);
    mockListUsers.mockResolvedValue({
      content: [activeClient],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<AdminUsers />, { route: '/admin/users' });

    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Banir'));
    expect(mockBanUser).toHaveBeenCalledWith(1);
  });

  it('clicking "Desbanir" calls unbanUser with user id', async () => {
    const user = userEvent.setup();
    mockUnbanUser.mockResolvedValue(undefined);
    mockListUsers.mockResolvedValue({
      content: [bannedProvider],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<AdminUsers />, { route: '/admin/users' });

    await waitFor(() => {
      expect(screen.getByText('Carlos Ferreira')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Desbanir'));
    expect(mockUnbanUser).toHaveBeenCalledWith(2);
  });

  it('role filter dropdown changes filter value', async () => {
    const user = userEvent.setup();
    mockListUsers.mockResolvedValue(singlePageData);
    renderWithProviders(<AdminUsers />, { route: '/admin/users' });

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Verify default value
    expect(select).toHaveValue('');

    // Change to "Clientes"
    await user.selectOptions(select, 'CLIENT');
    expect(select).toHaveValue('CLIENT');
  });

  it('does not show pagination when totalPages is 1', async () => {
    mockListUsers.mockResolvedValue(singlePageData);
    renderWithProviders(<AdminUsers />, { route: '/admin/users' });

    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
    expect(screen.queryByText('Seguinte')).not.toBeInTheDocument();
  });
});
