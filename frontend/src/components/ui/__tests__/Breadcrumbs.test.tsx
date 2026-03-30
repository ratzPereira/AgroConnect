import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from '../Breadcrumbs';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Breadcrumbs', () => {
  it('renders breadcrumb items', () => {
    renderWithRouter(
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: 'Pedidos', to: '/requests' },
        { label: 'Detalhes' },
      ]} />,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
  });

  it('renders links for non-last items with "to" prop', () => {
    renderWithRouter(
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: 'Pedidos', to: '/requests' },
        { label: 'Detalhes' },
      ]} />,
    );
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).not.toBeNull();
    expect(homeLink).toHaveAttribute('href', '/');

    const requestsLink = screen.getByText('Pedidos').closest('a');
    expect(requestsLink).not.toBeNull();
    expect(requestsLink).toHaveAttribute('href', '/requests');
  });

  it('renders plain text for the last item', () => {
    renderWithRouter(
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: 'Detalhes' },
      ]} />,
    );
    const lastItem = screen.getByText('Detalhes');
    expect(lastItem.closest('a')).toBeNull();
    expect(lastItem.tagName).toBe('SPAN');
    expect(lastItem.className).toContain('font-medium');
  });

  it('renders nothing for empty items array', () => {
    const { container } = renderWithRouter(<Breadcrumbs items={[]} />);
    expect(container.querySelector('nav')).toBeNull();
  });

  it('renders nav element with aria-label', () => {
    renderWithRouter(
      <Breadcrumbs items={[{ label: 'Home', to: '/' }]} />,
    );
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumbs');
  });

  it('renders item without to prop as plain text even if not last', () => {
    renderWithRouter(
      <Breadcrumbs items={[
        { label: 'Nenhum link' },
        { label: 'Final' },
      ]} />,
    );
    const firstItem = screen.getByText('Nenhum link');
    expect(firstItem.closest('a')).toBeNull();
  });
});
