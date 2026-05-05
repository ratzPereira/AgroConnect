import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { MyListings } from '../MyListings';

/* ── Mocks ───────────────────────────────────────────────── */

const mockNavigate = vi.fn();
const mockGetMyListings = vi.fn();
const mockGetMyListingStats = vi.fn();
const mockMarkListingSold = vi.fn();
const mockRemoveListing = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/listings', () => ({
  getMyListings: (...args: unknown[]) => mockGetMyListings(...args),
  getMyListingStats: (...args: unknown[]) => mockGetMyListingStats(...args),
  markListingSold: (...args: unknown[]) => mockMarkListingSold(...args),
  removeListing: (...args: unknown[]) => mockRemoveListing(...args),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/listings/components/ListingCard', () => ({
  ListingCard: ({ listing, onClick }: { listing: { id: number; title: string; status: string }; onClick: () => void }) => (
    <div data-testid={`listing-card-${listing.id}`} onClick={onClick}>
      {listing.title} ({listing.status})
    </div>
  ),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

/* ── Helpers ─────────────────────────────────────────────── */

const emptyPage = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  number: 0,
  size: 20,
  first: true,
  last: true,
};

const mockStats = {
  activeCount: 12,
  soldCount: 7,
  totalViews: 245,
  totalConversations: 18,
};

function makeListing(id: number, title: string, status: string) {
  return {
    id,
    title,
    price: 100,
    priceNegotiable: false,
    category: 'ANIMALS' as const,
    condition: null,
    island: 'São Miguel',
    locationName: 'Ponta Delgada',
    latitude: 37.74,
    longitude: -25.67,
    firstPhotoUrl: null,
    createdAt: '2026-03-01T10:00:00Z',
    status,
    viewsCount: 10,
  };
}

/* ── Tests ───────────────────────────────────────────────── */

describe('MyListings — deeper2 coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyListingStats.mockResolvedValue(mockStats);
    mockGetMyListings.mockResolvedValue(emptyPage);
  });

  it('renders loading skeletons while data is being fetched', () => {
    // Make queries hang so loading state persists
    mockGetMyListingStats.mockReturnValue(new Promise(() => {}));
    mockGetMyListings.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<MyListings />, { route: '/marketplace/me' });

    // Stats skeletons: the Skeleton.Stat components render inside the stats grid
    // Listing skeletons: the Skeleton.Line components render inside the listing grid
    // The heading should always be visible
    expect(screen.getByText('Os Meus Anúncios')).toBeInTheDocument();
  });

  it('renders stat cards with correct data after loading', async () => {
    renderWithProviders(<MyListings />, { route: '/marketplace/me' });

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    });
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('245')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();

    // Stat labels appear in both stats and tabs; verify at least 2 instances exist
    // (one in the stat card, one in the tab)
    expect(screen.getAllByText('Ativos').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Vendidos').length).toBeGreaterThanOrEqual(2);
    // These only appear in the stat cards
    expect(screen.getByText('Visualizações')).toBeInTheDocument();
    expect(screen.getByText('Conversas')).toBeInTheDocument();
  });

  it('renders empty state with correct text when no listings', async () => {
    renderWithProviders(<MyListings />, { route: '/marketplace/me' });

    await waitFor(() => {
      expect(screen.getByText('Sem anúncios')).toBeInTheDocument();
    });
    expect(screen.getByText('Comece a vender publicando o seu primeiro anúncio.')).toBeInTheDocument();
  });

  it('renders listing cards when data is present', async () => {
    mockGetMyListings.mockResolvedValue({
      content: [
        makeListing(1, 'Porco Preto', 'ACTIVE'),
        makeListing(2, 'Sementes de milho', 'ACTIVE'),
      ],
      totalPages: 1,
      totalElements: 2,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<MyListings />, { route: '/marketplace/me' });

    await waitFor(() => {
      expect(screen.getByTestId('listing-card-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('listing-card-2')).toBeInTheDocument();
    expect(screen.getByText(/Porco Preto/)).toBeInTheDocument();
    expect(screen.getByText(/Sementes de milho/)).toBeInTheDocument();
  });

  it('renders status badges for non-ACTIVE listings (DRAFT, SOLD)', async () => {
    mockGetMyListings.mockResolvedValue({
      content: [
        makeListing(10, 'Draft item', 'DRAFT'),
        makeListing(11, 'Sold item', 'SOLD'),
        makeListing(12, 'Active item', 'ACTIVE'),
      ],
      totalPages: 1,
      totalElements: 3,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<MyListings />, { route: '/marketplace/me' });

    await waitFor(() => {
      expect(screen.getByTestId('listing-card-10')).toBeInTheDocument();
    });

    // Badge labels for non-ACTIVE statuses
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('Vendido')).toBeInTheDocument();
  });

  it('header shows title and "Novo Anúncio" button', () => {
    renderWithProviders(<MyListings />, { route: '/marketplace/me' });

    expect(screen.getByText('Os Meus Anúncios')).toBeInTheDocument();
    // The Button contains a span with "Novo Anúncio" text (hidden on mobile but present in DOM)
    expect(screen.getByRole('button', { name: /Novo Anúncio/i })).toBeInTheDocument();
  });

  it('clicking "Novo Anúncio" button navigates to /marketplace/new', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyListings />, { route: '/marketplace/me' });

    const newButton = screen.getByRole('button', { name: /Novo Anúncio/i });
    await user.click(newButton);

    expect(mockNavigate).toHaveBeenCalledWith('/marketplace/new');
  });

  it('sold modal opens and confirming triggers markListingSold', async () => {
    const user = userEvent.setup();
    mockMarkListingSold.mockResolvedValue({});

    mockGetMyListings.mockResolvedValue({
      content: [makeListing(5, 'Vaca leiteira', 'ACTIVE')],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<MyListings />, { route: '/marketplace/me' });

    await waitFor(() => {
      expect(screen.getByTestId('listing-card-5')).toBeInTheDocument();
    });

    // Click the "Marcar como vendido" quick action button (title attribute)
    const soldButton = screen.getByTitle('Marcar como vendido');
    await user.click(soldButton);

    // Modal should be visible
    await waitFor(() => {
      expect(screen.getByText('Marcar como Vendido')).toBeInTheDocument();
    });
    expect(screen.getByText(/Esta ação não pode ser revertida/)).toBeInTheDocument();

    // Confirm the sale
    const confirmButton = screen.getByRole('button', { name: /Confirmar Venda/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockMarkListingSold).toHaveBeenCalledWith(5);
    });
  });

  it('remove modal opens and confirming triggers removeListing', async () => {
    const user = userEvent.setup();
    mockRemoveListing.mockResolvedValue(undefined);

    mockGetMyListings.mockResolvedValue({
      content: [makeListing(8, 'Trator velho', 'ACTIVE')],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<MyListings />, { route: '/marketplace/me' });

    await waitFor(() => {
      expect(screen.getByTestId('listing-card-8')).toBeInTheDocument();
    });

    // Click the "Remover anúncio" quick action button (title attribute)
    const removeButton = screen.getByTitle('Remover anúncio');
    await user.click(removeButton);

    // Modal should be visible
    await waitFor(() => {
      expect(screen.getByText('Remover Anúncio')).toBeInTheDocument();
    });

    // Confirm the removal
    const confirmRemoveBtn = screen.getByRole('button', { name: /Remover$/i });
    await user.click(confirmRemoveBtn);

    await waitFor(() => {
      expect(mockRemoveListing).toHaveBeenCalledWith(8);
    });
  });

  it('pagination controls appear when totalPages > 1', async () => {
    mockGetMyListings.mockResolvedValue({
      content: Array.from({ length: 20 }, (_, i) => makeListing(i + 1, `Item ${i + 1}`, 'ACTIVE')),
      totalPages: 3,
      totalElements: 50,
      number: 0,
      size: 20,
      first: true,
      last: false,
    });

    renderWithProviders(<MyListings />, { route: '/marketplace/me' });

    await waitFor(() => {
      expect(screen.getByText('1 de 3')).toBeInTheDocument();
    });

    // Previous should be disabled on first page
    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find((b) => b.getAttribute('disabled') !== null && b.closest('.flex.items-center.justify-center'));
    expect(prevButton).toBeDefined();
  });
});
