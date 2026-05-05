import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Privacy } from '../Privacy';
import type { ReactNode } from 'react';

/* ── Mocks ───────────────────────────────────────────────── */

let mockSEOHeadProps: { title: string; description: string; path: string } | null = null;

vi.mock('@/components/SEOHead', () => ({
  SEOHead: (props: { title: string; description: string; path: string }) => {
    mockSEOHeadProps = props;
    return <div data-testid="seo-head" data-title={props.title} />;
  },
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

/* ── IntersectionObserver polyfill for jsdom ─────────────── */

beforeAll(() => {
  const mockObserve = vi.fn();
  const mockDisconnect = vi.fn();

  global.IntersectionObserver = vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
  ) {
    this.observe = mockObserve;
    this.unobserve = vi.fn();
    this.disconnect = mockDisconnect;
  }) as unknown as typeof IntersectionObserver;

  // scrollIntoView is not implemented in jsdom
  Element.prototype.scrollIntoView = vi.fn();
});

/* ── Tests ───────────────────────────────────────────────── */

describe('Privacy — deeper coverage', () => {
  beforeEach(() => {
    mockSEOHeadProps = null;
  });

  it('renders title "Politica de Privacidade"', () => {
    renderWithProviders(<Privacy />, { route: '/privacy' });
    expect(screen.getByText('Politica de Privacidade')).toBeInTheDocument();
  });

  it('renders last updated date', () => {
    renderWithProviders(<Privacy />, { route: '/privacy' });
    expect(screen.getByText('Ultima atualizacao: 21 de marco de 2026')).toBeInTheDocument();
  });

  it('renders all 12 section headings', () => {
    renderWithProviders(<Privacy />, { route: '/privacy' });
    const sectionHeadings = [
      '1. Responsavel pelo Tratamento',
      '2. Dados Pessoais Recolhidos',
      '3. Base Legal do Tratamento',
      '4. Finalidades do Tratamento',
      '5. Partilha de Dados',
      '6. Transferencias Internacionais',
      '7. Prazo de Conservacao',
      '8. Direitos do Titular',
      '9. Cookies',
      '10. Medidas de Seguranca',
      '11. Alteracoes a Politica',
      '12. Contacto',
    ];
    for (const heading of sectionHeadings) {
      // Each heading appears in both the content h2 and the TOC buttons (desktop + mobile potentially)
      const elements = screen.getAllByText(heading);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('renders mobile TOC toggle button "Indice"', () => {
    renderWithProviders(<Privacy />, { route: '/privacy' });
    expect(screen.getByText('Indice')).toBeInTheDocument();
  });

  it('shows TOC items when mobile toggle is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Privacy />, { route: '/privacy' });

    const toggleButton = screen.getByText('Indice');
    await user.click(toggleButton);

    // After clicking, mobile TOC nav should be visible with all items
    // The items are buttons inside the mobile nav
    const tocButtons = screen.getAllByText('1. Responsavel pelo Tratamento');
    // Desktop TOC + content heading + mobile TOC = at least 3
    expect(tocButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders desktop TOC with 12 items', () => {
    renderWithProviders(<Privacy />, { route: '/privacy' });
    // Desktop TOC is an aside with buttons; each TOC_ITEMS entry appears at least once in the desktop sidebar
    // We check that the aside exists with the correct number of button items
    const desktopAside = document.querySelector('aside');
    expect(desktopAside).not.toBeNull();
    const desktopButtons = desktopAside?.querySelectorAll('button');
    expect(desktopButtons?.length).toBe(12);
  });

  it('renders section 1 content "Responsavel pelo Tratamento"', () => {
    renderWithProviders(<Privacy />, { route: '/privacy' });
    const section = document.getElementById('responsavel');
    expect(section).not.toBeNull();
    expect(section?.textContent).toContain('Responsavel pelo Tratamento');
  });

  it('renders contact email link', () => {
    renderWithProviders(<Privacy />, { route: '/privacy' });
    const emailLinks = screen.getAllByText('privacidade@agroconnect.pt');
    expect(emailLinks.length).toBeGreaterThanOrEqual(1);
    // At least one should be an anchor tag with mailto href
    const mailtoLink = emailLinks.find(
      (el) => el.tagName === 'A' && el.getAttribute('href') === 'mailto:privacidade@agroconnect.pt',
    );
    expect(mailtoLink).toBeDefined();
  });

  it('renders CNPD link', () => {
    renderWithProviders(<Privacy />, { route: '/privacy' });
    const cnpdLinks = screen.getAllByText('www.cnpd.pt');
    expect(cnpdLinks.length).toBeGreaterThanOrEqual(1);
    const cnpdAnchor = cnpdLinks.find(
      (el) => el.tagName === 'A' && el.getAttribute('href') === 'https://www.cnpd.pt',
    );
    expect(cnpdAnchor).toBeDefined();
  });

  it('renders SEOHead with correct title', () => {
    renderWithProviders(<Privacy />, { route: '/privacy' });
    expect(screen.getByTestId('seo-head')).toBeInTheDocument();
    expect(mockSEOHeadProps).not.toBeNull();
    expect(mockSEOHeadProps?.title).toBe('Política de Privacidade — AgroConnect');
    expect(mockSEOHeadProps?.path).toBe('/privacy');
  });
});
