import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// jsdom does not implement IntersectionObserver or scrollTo
beforeEach(() => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
  } as unknown as typeof global.IntersectionObserver;

  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div data-testid="motion-div" {...props}>
        {children as React.ReactNode}
      </div>
    ),
  },
  useReducedMotion: () => false,
}));

vi.mock('@/hooks/useMotionConfig', () => ({
  useMotionConfig: () => ({
    pageVariants: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
    pageTransition: { type: 'tween', duration: 0.2 },
    shouldAnimate: true,
  }),
}));

import { LegalPageLayout } from '../LegalPageLayout';

const defaultProps = {
  title: 'Termos de Serviço',
  lastUpdated: 'Última atualização: 01/01/2026',
  toc: [
    { id: 'section-1', label: 'Introdução' },
    { id: 'section-2', label: 'Privacidade' },
  ],
  sections: [
    { id: 'section-1', title: 'Introdução', content: <p>Bem-vindo ao AgroConnect.</p> },
    { id: 'section-2', title: 'Privacidade', content: <p>Os seus dados são protegidos.</p> },
  ],
};

describe('LegalPageLayout', () => {
  it('renders title and last updated date', () => {
    render(<LegalPageLayout {...defaultProps} />);

    expect(screen.getByText('Termos de Serviço')).toBeInTheDocument();
    expect(screen.getByText('Última atualização: 01/01/2026')).toBeInTheDocument();
  });

  it('renders all sections with content', () => {
    render(<LegalPageLayout {...defaultProps} />);

    // Section titles appear in both TOC and content, so use getAllByText
    expect(screen.getAllByText('Introdução').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Bem-vindo ao AgroConnect.')).toBeInTheDocument();
    expect(screen.getAllByText('Privacidade').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Os seus dados são protegidos.')).toBeInTheDocument();
  });

  it('renders table of contents links', () => {
    render(<LegalPageLayout {...defaultProps} />);

    // Desktop TOC + Mobile TOC = each link appears at least twice
    const introLinks = screen.getAllByText('Introdução');
    expect(introLinks.length).toBeGreaterThanOrEqual(2);
    const privacyLinks = screen.getAllByText('Privacidade');
    expect(privacyLinks.length).toBeGreaterThanOrEqual(2);
  });

  it('renders sections with correct IDs for anchor navigation', () => {
    const { container } = render(<LegalPageLayout {...defaultProps} />);

    const section1 = container.querySelector('#section-1');
    expect(section1).not.toBeNull();
    const section2 = container.querySelector('#section-2');
    expect(section2).not.toBeNull();
  });
});
