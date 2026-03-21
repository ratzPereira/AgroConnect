import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MobileNav } from '../MobileNav';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: { user: { role: string } | null }) => unknown) =>
    selector({ user: { role: 'CLIENT' } }),
  ),
}));

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: vi.fn((selector: (state: { unreadCount: number }) => unknown) =>
    selector({ unreadCount: 3 }),
  ),
}));

afterEach(() => cleanup());

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders client tabs', () => {
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    );
    expect(screen.getByText('Início')).toBeDefined();
    expect(screen.getByText('Pedidos')).toBeDefined();
    expect(screen.getByText('Alertas')).toBeDefined();
    expect(screen.getByText('Perfil')).toBeDefined();
  });

  it('shows notification badge', () => {
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    );
    expect(screen.getByText('3')).toBeDefined();
  });
});
