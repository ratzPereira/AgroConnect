import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleRoute } from '../RoleRoute';

let mockUser: { role: string } | null = { role: 'CLIENT' };

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: { user: typeof mockUser; isAuthenticated: boolean }) => unknown) =>
    selector({ user: mockUser, isAuthenticated: true }),
  ),
}));

describe('RoleRoute', () => {
  it('renders children when user role matches', () => {
    mockUser = { role: 'PROVIDER_MANAGER' };
    render(
      <MemoryRouter initialEntries={['/provider']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR']} />}>
            <Route path="/provider" element={<div>Provider Content</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(document.body.textContent).toContain('Provider Content');
  });

  it('redirects when user role does not match', () => {
    mockUser = { role: 'CLIENT' };
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<div>Admin Content</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(document.body.textContent).not.toContain('Admin Content');
  });

  it('handles multiple allowed roles', () => {
    mockUser = { role: 'PROVIDER_LEAD' };
    render(
      <MemoryRouter initialEntries={['/provider']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['PROVIDER_MANAGER', 'PROVIDER_LEAD', 'PROVIDER_OPERATOR']} />}>
            <Route path="/provider" element={<div>Provider Content</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(document.body.textContent).toContain('Provider Content');
  });

  it('redirects when user is null', () => {
    mockUser = null;
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<div>Admin Content</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(document.body.textContent).not.toContain('Admin Content');
  });
});
