import { describe, it, expect, vi, beforeAll } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Landing } from '../Landing';

// Polyfill IntersectionObserver for jsdom (framer-motion whileInView uses it internally)
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe(): void { /* noop */ }
  unobserve(): void { /* noop */ }
  disconnect(): void { /* noop */ }
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

// Mock framer-motion hooks to avoid animation issues
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
    useInView: () => false,
  };
});

// Mock useAnimatedCounter to return the target value immediately
vi.mock('@/hooks/useAnimatedCounter', () => ({
  useAnimatedCounter: (target: number) => target,
}));

function renderLanding() {
  return renderWithProviders(<Landing />, { route: '/landing' });
}

describe('Landing', () => {
  it('renders hero section with main headline', () => {
    renderLanding();
    expect(
      screen.getByText(/Serviços agrícolas ao alcance de um clique/i),
    ).toBeInTheDocument();
  });

  it('renders "Como funciona" section with steps', () => {
    renderLanding();
    expect(screen.getByText('Como funciona')).toBeInTheDocument();
    expect(screen.getByText('Publique o seu pedido')).toBeInTheDocument();
    expect(screen.getByText('Receba propostas')).toBeInTheDocument();
    expect(screen.getByText('Trabalho concluído')).toBeInTheDocument();
  });

  it('renders CTA button "Criar Conta Grátis"', () => {
    renderLanding();
    expect(screen.getByText('Criar Conta Grátis')).toBeInTheDocument();
  });

  it('renders statistics section with stat labels', () => {
    renderLanding();
    expect(screen.getByText('Ilhas Cobertas')).toBeInTheDocument();
    expect(screen.getByText('Categorias de Serviço')).toBeInTheDocument();
    expect(screen.getByText('Pagamento Seguro')).toBeInTheDocument();
    expect(screen.getByText('Avaliações Verificadas')).toBeInTheDocument();
  });
});
