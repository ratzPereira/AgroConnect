import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MobileNav } from '../MobileNav';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: vi.fn(),
}));

function setupMocks(role: string | undefined, unreadCount: number) {
  vi.mocked(useAuthStore).mockImplementation((selector) =>
    (selector as (state: { user: { role: string } | null }) => unknown)(
      role ? { user: { role } } : { user: null },
    ),
  );
  vi.mocked(useNotificationStore).mockImplementation((selector) =>
    (selector as (state: { unreadCount: number }) => unknown)({ unreadCount }),
  );
}

afterEach(() => cleanup());

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders base tabs for CLIENT role', () => {
    setupMocks('CLIENT', 0);
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    );
    expect(screen.getByText('Início')).toBeDefined();
    expect(screen.getByText('Pedidos')).toBeDefined();
    expect(screen.getByText('Marketplace')).toBeDefined();
    expect(screen.getByText('Alertas')).toBeDefined();
    expect(screen.getByText('Perfil')).toBeDefined();
  });

  it('shows notification badge when unread count is positive', () => {
    setupMocks('CLIENT', 3);
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    );
    expect(screen.getByText('3')).toBeDefined();
  });

  it('does not show notification badge when unread count is zero', () => {
    setupMocks('CLIENT', 0);
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    );
    // Badge should not render any number
    expect(screen.queryByText('0')).toBeNull();
  });

  it('shows 99+ when unread count exceeds 99', () => {
    setupMocks('CLIENT', 150);
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    );
    expect(screen.getByText('99+')).toBeDefined();
  });

  it('shows Equipa and Finanças tabs for PROVIDER_MANAGER role', () => {
    setupMocks('PROVIDER_MANAGER', 0);
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    );
    expect(screen.getByText('Equipa')).toBeDefined();
    expect(screen.getByText('Finanças')).toBeDefined();
    // Should not show Admin tab
    expect(screen.queryByText('Admin')).toBeNull();
  });

  it('shows Equipa and Finanças tabs for PROVIDER_LEAD role', () => {
    setupMocks('PROVIDER_LEAD', 0);
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    );
    expect(screen.getByText('Equipa')).toBeDefined();
    expect(screen.getByText('Finanças')).toBeDefined();
  });

  it('shows Equipa and Finanças tabs for PROVIDER_OPERATOR role', () => {
    setupMocks('PROVIDER_OPERATOR', 0);
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    );
    expect(screen.getByText('Equipa')).toBeDefined();
    expect(screen.getByText('Finanças')).toBeDefined();
  });

  it('shows Admin tab for ADMIN role', () => {
    setupMocks('ADMIN', 0);
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    );
    expect(screen.getByText('Admin')).toBeDefined();
    // Should not show provider-specific tabs
    expect(screen.queryByText('Equipa')).toBeNull();
    expect(screen.queryByText('Finanças')).toBeNull();
  });

  it('renders without provider or admin tabs when user is null', () => {
    setupMocks(undefined, 0);
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    );
    expect(screen.getByText('Início')).toBeDefined();
    expect(screen.getByText('Pedidos')).toBeDefined();
    expect(screen.getByText('Marketplace')).toBeDefined();
    expect(screen.getByText('Alertas')).toBeDefined();
    expect(screen.getByText('Perfil')).toBeDefined();
    // No provider or admin tabs
    expect(screen.queryByText('Equipa')).toBeNull();
    expect(screen.queryByText('Finanças')).toBeNull();
    expect(screen.queryByText('Admin')).toBeNull();
  });

  it('renders nav links with correct hrefs', () => {
    setupMocks('CLIENT', 0);
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole('link');
    const hrefs = links.map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/requests');
    expect(hrefs).toContain('/marketplace');
    expect(hrefs).toContain('/notifications');
    expect(hrefs).toContain('/profile');
  });
});
