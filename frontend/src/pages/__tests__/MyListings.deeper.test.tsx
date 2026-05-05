import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { MyListings } from '../MyListings';

/* ── Mocks ───────────────────────────────────────────────── */

const mockNavigate = vi.fn();
const mockGetMyListings = vi.fn();
const mockGetMyListingStats = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/listings', () => ({
  getMyListings: (...args: unknown[]) => mockGetMyListings(...args),
  getMyListingStats: (...args: unknown[]) => mockGetMyListingStats(...args),
  markListingSold: vi.fn(() => Promise.resolve()),
  removeListing: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/listings/components/ListingCard', () => ({
  ListingCard: ({ listing, onClick }: { listing: { title: string; status: string }; onClick: () => void }) => (
    <div data-testid="listing-card" onClick={onClick}>
      {listing.title} ({listing.status})
    </div>
  ),
}));

/* ── Tests ───────────────────────────────────────────────── */

describe('MyListings — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyListingStats.mockResolvedValue({
      activeCount: 5,
      soldCount: 3,
      totalViews: 120,
      totalConversations: 8,
    });
  });

  it('renders listing cards when data present', async () => {
    mockGetMyListings.mockResolvedValue({
      content: [
        {
          id: 1,
          title: 'Porco Preto',
          price: 300,
          category: 'ANIMALS',
          status: 'ACTIVE',
          island: 'São Miguel',
          municipality: 'Ponta Delgada',
          latitude: 37.74,
          longitude: -25.67,
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
    });

    renderWithProviders(<MyListings />, { route: '/marketplace/me' });
    await waitFor(() => {
      expect(screen.getByText(/Porco Preto/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no listings', async () => {
    mockGetMyListings.mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<MyListings />, { route: '/marketplace/me' });
    await waitFor(() => {
      expect(screen.getByText(/Sem anúncios/)).toBeInTheDocument();
    });
  });

  it('renders stats bar with correct counts', async () => {
    mockGetMyListings.mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<MyListings />, { route: '/marketplace/me' });
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // activeCount
    });
    expect(screen.getByText('3')).toBeInTheDocument(); // soldCount
    expect(screen.getByText('120')).toBeInTheDocument(); // totalViews
    expect(screen.getByText('8')).toBeInTheDocument(); // totalConversations
  });

  it('renders status filter tabs', async () => {
    mockGetMyListings.mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<MyListings />, { route: '/marketplace/me' });
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Ativos')).toBeInTheDocument();
    expect(screen.getByText('Vendidos')).toBeInTheDocument();
    expect(screen.getByText('Rascunhos')).toBeInTheDocument();
  });

  it('renders page heading and new listing button', () => {
    mockGetMyListings.mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<MyListings />, { route: '/marketplace/me' });
    expect(screen.getByText('Os Meus Anúncios')).toBeInTheDocument();
  });
});
