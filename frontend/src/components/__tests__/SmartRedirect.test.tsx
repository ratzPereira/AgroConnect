import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SmartRedirect } from '../SmartRedirect';

let mockIsAuthenticated = false;
let mockRole: string | undefined;

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: { isAuthenticated: boolean; user: { role: string } | null }) => unknown) =>
    selector({ isAuthenticated: mockIsAuthenticated, user: mockRole ? { role: mockRole } : null }),
  ),
}));

function renderRedirect() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<SmartRedirect />} />
        <Route path="/landing" element={<div>Landing Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SmartRedirect', () => {
  it('redirects to /landing when not authenticated', () => {
    mockIsAuthenticated = false;
    mockRole = undefined;
    renderRedirect();
    expect(document.body.textContent).toContain('Landing Page');
  });

  it('redirects to /dashboard when authenticated as a non-admin', () => {
    mockIsAuthenticated = true;
    mockRole = 'CLIENT';
    renderRedirect();
    expect(document.body.textContent).toContain('Dashboard');
  });

  it('redirects to /admin/dashboard when authenticated as an admin', () => {
    mockIsAuthenticated = true;
    mockRole = 'ADMIN';
    renderRedirect();
    expect(document.body.textContent).toContain('Admin Dashboard');
  });
});
