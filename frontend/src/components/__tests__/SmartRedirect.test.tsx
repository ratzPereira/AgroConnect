import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SmartRedirect } from '../SmartRedirect';

let mockIsAuthenticated = false;

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: mockIsAuthenticated }),
  ),
}));

describe('SmartRedirect', () => {
  it('redirects to /landing when not authenticated', () => {
    mockIsAuthenticated = false;
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SmartRedirect />} />
          <Route path="/landing" element={<div>Landing Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(document.body.textContent).toContain('Landing Page');
  });

  it('redirects to /dashboard when authenticated', () => {
    mockIsAuthenticated = true;
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SmartRedirect />} />
          <Route path="/landing" element={<div>Landing Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(document.body.textContent).toContain('Dashboard');
  });
});
