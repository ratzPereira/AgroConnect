import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

let mockIsAuthenticated = false;

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: mockIsAuthenticated }),
  ),
}));

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    mockIsAuthenticated = true;
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(document.body.textContent).toContain('Protected Content');
  });

  it('redirects to /login when not authenticated', () => {
    mockIsAuthenticated = false;
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(document.body.textContent).toContain('Login Page');
  });

  it('does not render protected content when not authenticated', () => {
    mockIsAuthenticated = false;
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(document.body.textContent).not.toContain('Protected Content');
  });
});
