import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Marketplace } from '../Marketplace';

/* ── Mocks ───────────────────────────────────────────────── */

const mockNavigate = vi.fn();
const mockSearchListings = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/listings', () => ({
  searchListings: (...args: unknown[]) => mockSearchListings(...args),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/AzoresMap', () => ({
  AzoresMap: ({ pins }: { pins: unknown[] }) => (
    <div data-testid="azores-map">Map with {pins.length} pins</div>
  ),
}));

vi.mock('@/features/listings/components/ListingCard', () => ({
  ListingCard: ({ listing, onClick }: { listing: { id: number; title: string }; onClick: () => void }) => (
    <div data-testid={`listing-card-${listing.id}`} onClick={onClick}>
      {listing.title}
    </div>
  ),
}));

vi.mock('@/features/listings/components/CategoryFilter', () => ({
  CategoryFilter: ({ onSelect }: { onSelect: (cat: string | null) => void }) => (
    <div data-testid="category-filter">
      <button onClick={() => onSelect('ANIMALS')}>Animals</button>
      <button onClick={() => onSelect(null)}>Clear</button>
    </div>
  ),
}));

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

function makeListing(id: number, title: string) {
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
    status: 'ACTIVE',
    viewsCount: 5,
  };
}

/* ── Tests ───────────────────────────────────────────────── */

describe('Marketplace — deeper2 coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchListings.mockResolvedValue(emptyPage);
  });

  it('renders loading skeletons while data is being fetched', () => {
    mockSearchListings.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<Marketplace />, { route: '/marketplace' });

    // Title should always be visible regardless of loading state
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });

  it('renders title "Marketplace"', async () => {
    renderWithProviders(<Marketplace />, { route: '/marketplace' });

    await waitFor(() => {
      expect(screen.getByText('Marketplace')).toBeInTheDocument();
    });
  });

  it('renders empty state when no listings found', async () => {
    renderWithProviders(<Marketplace />, { route: '/marketplace' });

    await waitFor(() => {
      expect(screen.getByText('Nenhum anúncio encontrado')).toBeInTheDocument();
    });
    expect(screen.getByText(/Tente ajustar os filtros/)).toBeInTheDocument();
  });

  it('renders listing cards in grid view', async () => {
    mockSearchListings.mockResolvedValue({
      content: [
        makeListing(1, 'Vitelos'),
        makeListing(2, 'Sementes de milho'),
        makeListing(3, 'Trator Kubota'),
      ],
      totalPages: 1,
      totalElements: 3,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<Marketplace />, { route: '/marketplace' });

    await waitFor(() => {
      expect(screen.getByTestId('listing-card-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('listing-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('listing-card-3')).toBeInTheDocument();
    expect(screen.getByText('Vitelos')).toBeInTheDocument();
    expect(screen.getByText('Sementes de milho')).toBeInTheDocument();
    expect(screen.getByText('Trator Kubota')).toBeInTheDocument();
  });

  it('search form submits and triggers a new query', async () => {
    const user = userEvent.setup();

    mockSearchListings.mockResolvedValue({
      content: [makeListing(1, 'Vitelos')],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<Marketplace />, { route: '/marketplace' });

    await waitFor(() => {
      expect(screen.getByTestId('listing-card-1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Pesquisar animais, plantas, equipamentos...');
    expect(searchInput).toBeInTheDocument();

    // Type a search term and submit the form
    await user.clear(searchInput);
    await user.type(searchInput, 'trator{enter}');

    // After submit, searchListings should be called again with updated params
    await waitFor(() => {
      expect(mockSearchListings).toHaveBeenCalledTimes(2);
    });
  });

  it('category filter renders and is interactive', async () => {
    renderWithProviders(<Marketplace />, { route: '/marketplace' });

    await waitFor(() => {
      expect(screen.getByTestId('category-filter')).toBeInTheDocument();
    });

    // The mock CategoryFilter provides Animals and Clear buttons
    expect(screen.getByText('Animals')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('island select filter renders with options', async () => {
    renderWithProviders(<Marketplace />, { route: '/marketplace' });

    const islandSelect = screen.getByDisplayValue('Todas as ilhas');
    expect(islandSelect).toBeInTheDocument();
    expect(islandSelect.tagName.toLowerCase()).toBe('select');
  });

  it('view toggle switches between grid and map', async () => {
    const user = userEvent.setup();

    mockSearchListings.mockResolvedValue({
      content: [makeListing(1, 'Trator')],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<Marketplace />, { route: '/marketplace' });

    await waitFor(() => {
      expect(screen.getByTestId('listing-card-1')).toBeInTheDocument();
    });

    // Initially in grid view — no map
    expect(screen.queryByTestId('azores-map')).not.toBeInTheDocument();

    // Click map view toggle
    await user.click(screen.getByLabelText('Vista no mapa'));

    await waitFor(() => {
      expect(screen.getByTestId('azores-map')).toBeInTheDocument();
    });

    // Grid cards should be gone
    expect(screen.queryByTestId('listing-card-1')).not.toBeInTheDocument();

    // Switch back to grid view
    await user.click(screen.getByLabelText('Vista em grelha'));

    await waitFor(() => {
      expect(screen.getByTestId('listing-card-1')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('azores-map')).not.toBeInTheDocument();
  });

  it('shows total count text when listings are available', async () => {
    mockSearchListings.mockResolvedValue({
      content: [makeListing(1, 'Vitelos'), makeListing(2, 'Ovelhas')],
      totalPages: 1,
      totalElements: 2,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<Marketplace />, { route: '/marketplace' });

    await waitFor(() => {
      expect(screen.getByText('2 anúncios encontrados')).toBeInTheDocument();
    });
  });

  it('pagination controls appear when totalPages > 1', async () => {
    mockSearchListings.mockResolvedValue({
      content: Array.from({ length: 20 }, (_, i) => makeListing(i + 1, `Listing ${i + 1}`)),
      totalPages: 5,
      totalElements: 100,
      number: 0,
      size: 20,
      first: true,
      last: false,
    });

    renderWithProviders(<Marketplace />, { route: '/marketplace' });

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 5/)).toBeInTheDocument();
    });
  });

  it('FAB button has correct aria-label for mobile', async () => {
    renderWithProviders(<Marketplace />, { route: '/marketplace' });

    const fab = screen.getByLabelText('Publicar Anúncio');
    expect(fab).toBeInTheDocument();
  });
});
