import { describe, it, expect, vi, beforeAll } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Privacy } from '../Privacy';

beforeAll(() => {
  // IntersectionObserver is not available in jsdom — must use function (not arrow) for `new`
  global.IntersectionObserver = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
  }) as unknown as typeof IntersectionObserver;
});

vi.mock('@/components/SEOHead', () => ({
  SEOHead: () => null,
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Privacy', () => {
  it('renders privacy policy title', () => {
    renderWithProviders(<Privacy />, { route: '/privacy' });
    expect(screen.getByText('Politica de Privacidade')).toBeInTheDocument();
  });

  it('renders privacy content sections', () => {
    renderWithProviders(<Privacy />, { route: '/privacy' });
    // Each section text appears in both the TOC and the content heading
    expect(screen.getAllByText('1. Responsavel pelo Tratamento').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2. Dados Pessoais Recolhidos').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('12. Contacto').length).toBeGreaterThanOrEqual(1);
  });
});
