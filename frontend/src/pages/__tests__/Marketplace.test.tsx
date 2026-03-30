import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Marketplace } from '../Marketplace';

vi.mock('@/api/listings', () => ({
  searchListings: vi.fn(() =>
    Promise.resolve({
      content: [
        {
          id: 1,
          title: 'Vitelos Holstein',
          price: 500,
          category: 'ANIMALS',
          island: 'São Miguel',
          municipality: 'Ponta Delgada',
          latitude: 37.74,
          longitude: -25.67,
          status: 'ACTIVE',
          photoUrls: [],
          sellerName: 'João',
          createdAt: '2026-03-01T10:00:00Z',
        },
      ],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    }),
  ),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/AzoresMap', () => ({
  AzoresMap: () => <div data-testid="map" />,
}));

vi.mock('@/features/listings/components/ListingCard', () => ({
  ListingCard: ({ listing }: { listing: { title: string } }) => (
    <div data-testid="listing-card">{listing.title}</div>
  ),
}));

vi.mock('@/features/listings/components/CategoryFilter', () => ({
  CategoryFilter: () => <div data-testid="category-filter">Categories</div>,
}));

describe('Marketplace', () => {
  it('renders marketplace page heading', () => {
    renderWithProviders(<Marketplace />, { route: '/marketplace' });
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });

  it('shows search input and filter controls', () => {
    renderWithProviders(<Marketplace />, { route: '/marketplace' });
    expect(
      screen.getByPlaceholderText('Pesquisar animais, plantas, equipamentos...'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('category-filter')).toBeInTheDocument();
    expect(screen.getByText('Perto de mim')).toBeInTheDocument();
  });

  it('shows listings grid when data available', async () => {
    renderWithProviders(<Marketplace />, { route: '/marketplace' });
    await waitFor(() => {
      expect(screen.getByTestId('listing-card')).toBeInTheDocument();
    });
    expect(screen.getByText('Vitelos Holstein')).toBeInTheDocument();
  });
});
