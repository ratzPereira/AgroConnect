import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { NotFound } from '../NotFound';

describe('NotFound', () => {
  it('renders 404 message', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Página não encontrada')).toBeInTheDocument();
  });

  it('has link to go back home', () => {
    renderWithProviders(<NotFound />);
    const link = screen.getByRole('link', { name: /voltar ao início/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
