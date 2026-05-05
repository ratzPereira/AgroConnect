import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PublicLayout } from '../PublicLayout';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: unknown) => {
    const state = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    };
    return typeof selector === 'function' ? (selector as (s: typeof state) => unknown)(state) : state;
  }),
}));

describe('PublicLayout', () => {
  it('renders Outlet content', () => {
    render(
      <MemoryRouter initialEntries={['/terms']}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/terms" element={<div>Terms Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Terms Content')).toBeInTheDocument();
  });

  it('renders layout structure with navbar and footer', () => {
    render(
      <MemoryRouter initialEntries={['/terms']}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/terms" element={<div>Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    // Text appears in both desktop and mobile nav, and/or footer
    expect(screen.getAllByText('AgroConnect').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Termos').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Privacidade').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Todos os direitos reservados/)).toBeInTheDocument();
  });
});
