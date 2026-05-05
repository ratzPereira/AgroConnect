import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { MyListings } from '../MyListings';

vi.mock('@/api/listings', () => ({
  getMyListings: vi.fn(() =>
    Promise.resolve({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 20,
      first: true,
      last: true,
    }),
  ),
  getMyListingStats: vi.fn(() =>
    Promise.resolve({
      activeCount: 0,
      soldCount: 0,
      totalViews: 0,
      totalConversations: 0,
    }),
  ),
  markListingSold: vi.fn(),
  removeListing: vi.fn(),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/listings/components/ListingCard', () => ({
  ListingCard: ({ listing }: { listing: { title: string } }) => (
    <div data-testid="listing-card">{listing.title}</div>
  ),
}));

describe('MyListings', () => {
  it('renders my listings page title', () => {
    renderWithProviders(<MyListings />, { route: '/marketplace/me' });
    expect(screen.getByText('Os Meus Anúncios')).toBeInTheDocument();
  });

  it('shows create listing button', () => {
    renderWithProviders(<MyListings />, { route: '/marketplace/me' });
    expect(screen.getByText('Novo Anúncio')).toBeInTheDocument();
  });
});
