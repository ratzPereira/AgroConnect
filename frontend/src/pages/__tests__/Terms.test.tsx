import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Terms } from '../Terms';

vi.mock('@/components/SEOHead', () => ({
  SEOHead: () => null,
}));

vi.mock('@/components/LegalPageLayout', () => ({
  LegalPageLayout: ({ title, sections }: { title: string; sections: Array<{ id: string; title: string; content: React.ReactNode }> }) => (
    <div>
      <h1>{title}</h1>
      {sections.map((s) => (
        <section key={s.id}>
          <h2>{s.title}</h2>
          {s.content}
        </section>
      ))}
    </div>
  ),
}));

describe('Terms', () => {
  it('renders terms page with title', () => {
    renderWithProviders(<Terms />, { route: '/terms' });
    expect(screen.getByText('Termos e Condicoes de Utilizacao')).toBeInTheDocument();
  });

  it('renders terms content sections', () => {
    renderWithProviders(<Terms />, { route: '/terms' });
    expect(screen.getByText('1. Identificacao')).toBeInTheDocument();
    expect(screen.getByText('2. Definicoes')).toBeInTheDocument();
    expect(screen.getByText('16. Lei Aplicavel')).toBeInTheDocument();
  });
});
