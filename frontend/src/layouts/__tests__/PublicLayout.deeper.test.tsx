import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PublicLayout } from '../PublicLayout';

/* ── Mocks ───────────────────────────────────────────────── */

let mockIsAuthenticated = false;

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: unknown) => {
    const state = {
      isAuthenticated: mockIsAuthenticated,
      user: mockIsAuthenticated
        ? { id: 1, email: 'test@test.pt', name: 'Teste', role: 'CLIENT' as const }
        : null,
      accessToken: mockIsAuthenticated ? 'token' : null,
      refreshToken: mockIsAuthenticated ? 'refresh' : null,
    };
    return typeof selector === 'function'
      ? (selector as (s: typeof state) => unknown)(state)
      : state;
  }),
}));

/* ── Helpers ─────────────────────────────────────────────── */

function renderLayout(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="*" element={<div data-testid="outlet-content">Page Content Here</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

/* ── Tests ───────────────────────────────────────────────── */

describe('PublicLayout — deeper coverage', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
  });

  it('renders desktop nav with correct links (Como Funciona, Funcionalidades, Termos, Privacidade)', () => {
    renderLayout();
    // Both desktop and mobile nav render these links — at least 2 of each
    expect(screen.getAllByText('Como Funciona').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Funcionalidades').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Termos').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Privacidade').length).toBeGreaterThanOrEqual(2);
  });

  it('shows "Entrar" and "Registar" buttons when not authenticated', () => {
    mockIsAuthenticated = false;
    renderLayout();
    // Desktop and mobile each show these buttons
    const entrarButtons = screen.getAllByText('Entrar');
    const registarButtons = screen.getAllByText('Registar');
    expect(entrarButtons.length).toBeGreaterThanOrEqual(2);
    expect(registarButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('does not show "Dashboard" when not authenticated', () => {
    mockIsAuthenticated = false;
    renderLayout();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('shows "Dashboard" button when authenticated', () => {
    mockIsAuthenticated = true;
    renderLayout();
    // Desktop and mobile each show Dashboard
    const dashboardButtons = screen.getAllByText('Dashboard');
    expect(dashboardButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('does not show "Entrar" or "Registar" when authenticated', () => {
    mockIsAuthenticated = true;
    renderLayout();
    expect(screen.queryByText('Entrar')).not.toBeInTheDocument();
    expect(screen.queryByText('Registar')).not.toBeInTheDocument();
  });

  it('renders footer with copyright, Termos de Servico, and Politica de Privacidade', () => {
    renderLayout();
    expect(screen.getByText(/2026 AgroConnect/)).toBeInTheDocument();
    expect(screen.getByText(/Todos os direitos reservados/)).toBeInTheDocument();
    expect(screen.getByText('Termos de Serviço')).toBeInTheDocument();
    expect(screen.getByText('Política de Privacidade')).toBeInTheDocument();
    expect(screen.getByText('Serviços agrícolas nos Açores')).toBeInTheDocument();
  });

  it('renders Outlet content inside main', () => {
    renderLayout();
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
    expect(screen.getByText('Page Content Here')).toBeInTheDocument();
  });

  it('mobile hamburger opens menu (aria-label changes to "Fechar menu")', async () => {
    const user = userEvent.setup();
    renderLayout();
    const hamburger = screen.getByLabelText('Abrir menu');
    expect(hamburger).toBeInTheDocument();

    await user.click(hamburger);
    expect(screen.getByLabelText('Fechar menu')).toBeInTheDocument();
    expect(screen.queryByLabelText('Abrir menu')).not.toBeInTheDocument();
  });

  it('mobile hamburger toggle: click again closes menu', async () => {
    const user = userEvent.setup();
    renderLayout();

    // Open
    await user.click(screen.getByLabelText('Abrir menu'));
    expect(screen.getByLabelText('Fechar menu')).toBeInTheDocument();

    // Close
    await user.click(screen.getByLabelText('Fechar menu'));
    expect(screen.getByLabelText('Abrir menu')).toBeInTheDocument();
    expect(screen.queryByLabelText('Fechar menu')).not.toBeInTheDocument();
  });

  it('clicking a mobile nav link closes the menu', async () => {
    const user = userEvent.setup();
    renderLayout();

    // Open mobile menu
    await user.click(screen.getByLabelText('Abrir menu'));
    expect(screen.getByLabelText('Fechar menu')).toBeInTheDocument();

    // The mobile menu links have onClick that closes the menu.
    // Get the mobile "Termos" link — it is a Link component rendered inside mobile nav.
    // There are multiple "Termos" elements (desktop + mobile); the mobile ones have onClick.
    const termosLinks = screen.getAllByText('Termos');
    // Click the last one (mobile), since desktop nav is first in DOM
    await user.click(termosLinks[termosLinks.length - 1]);

    // Menu should close
    expect(screen.getByLabelText('Abrir menu')).toBeInTheDocument();
  });

  it('renders AgroConnect logo linking to /', () => {
    renderLayout();
    // The logo is a Link to "/"
    const logos = screen.getAllByText('AgroConnect');
    const headerLogo = logos[0];
    expect(headerLogo.closest('a')).toHaveAttribute('href', '/');
  });
});
