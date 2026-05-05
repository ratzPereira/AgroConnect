import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/* -- Mocks -------------------------------------------------- */

const mockNavigate = vi.fn();
const mockLogoutApi = vi.fn(() => Promise.resolve());
const mockStoreLogout = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/auth', () => ({
  logout: (...args: unknown[]) => mockLogoutApi(...args),
}));

let mockUser: { id: number; name: string; email: string; role: string } | null = {
  id: 1,
  name: 'Maria Silva',
  email: 'maria@agro.pt',
  role: 'CLIENT',
};

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
    logout: mockStoreLogout,
  })),
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

vi.mock('@/components/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell">NotificationBell</div>,
}));

vi.mock('@/components/MobileNav', () => ({
  MobileNav: () => <nav data-testid="mobile-nav">MobileNav</nav>,
}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Mock all lucide-react icons used by MainLayout as simple spans
vi.mock('lucide-react', () => {
  const iconFactory = (name: string) =>
    function MockIcon(props: Record<string, unknown>) {
      return <span data-testid={`icon-${name}`} {...props} />;
    };
  return {
    LayoutDashboard: iconFactory('LayoutDashboard'),
    FileText: iconFactory('FileText'),
    CreditCard: iconFactory('CreditCard'),
    Bell: iconFactory('Bell'),
    LogOut: iconFactory('LogOut'),
    Users: iconFactory('Users'),
    Wrench: iconFactory('Wrench'),
    Package: iconFactory('Package'),
    DollarSign: iconFactory('DollarSign'),
    Shield: iconFactory('Shield'),
    UserCog: iconFactory('UserCog'),
    User: iconFactory('User'),
    CalendarRange: iconFactory('CalendarRange'),
    Store: iconFactory('Store'),
  };
});

// Import MainLayout after vi.mock declarations (vi.mock is hoisted by Vitest)
import { MainLayout } from '../MainLayout';

/* -- Helpers ------------------------------------------------- */

function renderLayout(route = '/dashboard') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="*" element={<div>Page Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/* -- Tests --------------------------------------------------- */

describe('MainLayout — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      id: 1,
      name: 'Maria Silva',
      email: 'maria@agro.pt',
      role: 'CLIENT',
    };
  });

  it('renders logo in sidebar', () => {
    renderLayout();
    const logos = screen.getAllByAltText('AgroConnect');
    expect(logos.length).toBeGreaterThanOrEqual(1);
  });

  it('renders common nav items for CLIENT role', () => {
    mockUser = { id: 1, name: 'Cliente', email: 'c@agro.pt', role: 'CLIENT' };
    renderLayout();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Transações')).toBeInTheDocument();
    expect(screen.getByText('Notificações')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    // CLIENT should NOT see provider items
    expect(screen.queryByText('Equipa')).not.toBeInTheDocument();
    expect(screen.queryByText('Máquinas')).not.toBeInTheDocument();
  });

  it('renders provider nav items for PROVIDER_MANAGER role', () => {
    mockUser = { id: 2, name: 'Prestador', email: 'p@agro.pt', role: 'PROVIDER_MANAGER' };
    renderLayout();
    // Common items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    // Provider-specific items
    expect(screen.getByText('Equipa')).toBeInTheDocument();
    expect(screen.getByText('Máquinas')).toBeInTheDocument();
    expect(screen.getByText('Inventário')).toBeInTheDocument();
    expect(screen.getByText('Calendário')).toBeInTheDocument();
    expect(screen.getByText('Finanças')).toBeInTheDocument();
  });

  it('renders admin nav items for ADMIN role', () => {
    mockUser = { id: 3, name: 'Admin', email: 'admin@agro.pt', role: 'ADMIN' };
    renderLayout();
    // Admin should NOT see Dashboard (filtered out)
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    // Common items minus Dashboard
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    // Admin-specific items
    expect(screen.getByText('Administração')).toBeInTheDocument();
    expect(screen.getByText('Utilizadores')).toBeInTheDocument();
    // Should NOT see provider items
    expect(screen.queryByText('Equipa')).not.toBeInTheDocument();
  });

  it('renders user email in sidebar', () => {
    renderLayout();
    expect(screen.getByText('maria@agro.pt')).toBeInTheDocument();
  });

  it('renders user name in sidebar', () => {
    renderLayout();
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
  });

  it('renders "Terminar sessão" button', () => {
    renderLayout();
    expect(screen.getByText('Terminar sessão')).toBeInTheDocument();
  });

  it('renders MobileNav component', () => {
    renderLayout();
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
  });

  it('renders NotificationBell', () => {
    renderLayout();
    const bells = screen.getAllByTestId('notification-bell');
    expect(bells.length).toBeGreaterThanOrEqual(1);
  });

  it('calls logout API and navigates on logout click', async () => {
    const user = userEvent.setup();
    renderLayout();

    const logoutButton = screen.getByText('Terminar sessão');
    await user.click(logoutButton);

    await waitFor(() => {
      expect(mockLogoutApi).toHaveBeenCalledTimes(1);
    });
    expect(mockStoreLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
