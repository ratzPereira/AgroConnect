import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '../MainLayout';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: unknown) => {
    const state = {
      user: { id: 1, name: 'João Pereira', email: 'joao@test.pt', role: 'CLIENT' },
      isAuthenticated: true,
      accessToken: 'token',
      refreshToken: 'refresh',
      logout: vi.fn(),
    };
    return typeof selector === 'function' ? (selector as (s: typeof state) => unknown)(state) : state;
  }),
}));

vi.mock('@/api/auth', () => ({
  logout: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

vi.mock('@/components/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock('@/components/MobileNav', () => ({
  MobileNav: () => <nav data-testid="mobile-nav" />,
}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderMainLayout(route = '/dashboard') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MainLayout', () => {
  it('renders sidebar navigation', () => {
    renderMainLayout();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });

  it('renders Outlet area with page content', () => {
    renderMainLayout();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('shows user info in sidebar', () => {
    renderMainLayout();
    expect(screen.getByText('João Pereira')).toBeInTheDocument();
    expect(screen.getByText('joao@test.pt')).toBeInTheDocument();
  });
});
