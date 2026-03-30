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
    <div data-testid="map">Map with {pins.length} pins</div>
  ),
}));

vi.mock('@/features/listings/components/ListingCard', () => ({
  ListingCard: ({ listing, onClick }: { listing: { title: string }; onClick: () => void }) => (
    <div data-testid="listing-card" onClick={onClick}>
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

/* ── Tests ───────────────────────────────────────────────── */

describe('Marketplace — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no listings found', async () => {
    mockSearchListings.mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    renderWithProviders(<Marketplace />, { route: '/marketplace' });
    await waitFor(() => {
      expect(screen.getByText('Nenhum anúncio encontrado')).toBeInTheDocument();
    });
    expect(screen.getByText(/Tente ajustar os filtros/)).toBeInTheDocument();
  });

  it('shows listings count when data available', async () => {
    mockSearchListings.mockResolvedValue({
      content: [
        {
          id: 1,
          title: 'Vitelos',
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
        {
          id: 2,
          title: 'Sementes de milho',
          price: 30,
          category: 'SEEDS',
          island: 'Terceira',
          municipality: 'Angra',
          latitude: 38.65,
          longitude: -27.22,
          status: 'ACTIVE',
          photoUrls: [],
          sellerName: 'Ana',
          createdAt: '2026-03-02T10:00:00Z',
        },
      ],
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

  it('renders view toggle buttons for grid and map', async () => {
    mockSearchListings.mockResolvedValue({
      content: [
        {
          id: 1,
          title: 'Trator',
          price: 5000,
          category: 'EQUIPMENT',
          island: 'São Miguel',
          municipality: 'Ribeira Grande',
          latitude: 37.78,
          longitude: -25.52,
          status: 'ACTIVE',
          photoUrls: [],
          sellerName: 'Pedro',
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

    renderWithProviders(<Marketplace />, { route: '/marketplace' });
    await waitFor(() => {
      expect(screen.getByTestId('listing-card')).toBeInTheDocument();
    });
    // Grid view button
    expect(screen.getByLabelText('Vista em grelha')).toBeInTheDocument();
    // Map view button
    expect(screen.getByLabelText('Vista no mapa')).toBeInTheDocument();
  });

  it('switches to map view when map toggle is clicked', async () => {
    const user = userEvent.setup();
    mockSearchListings.mockResolvedValue({
      content: [
        {
          id: 1,
          title: 'Trator',
          price: 5000,
          category: 'EQUIPMENT',
          island: 'São Miguel',
          municipality: 'Ribeira Grande',
          latitude: 37.78,
          longitude: -25.52,
          status: 'ACTIVE',
          photoUrls: [],
          sellerName: 'Pedro',
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

    renderWithProviders(<Marketplace />, { route: '/marketplace' });
    await waitFor(() => {
      expect(screen.getByTestId('listing-card')).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText('Vista no mapa'));
    await waitFor(() => {
      expect(screen.getByTestId('map')).toBeInTheDocument();
    });
  });

  it('renders pagination when multiple pages exist', async () => {
    mockSearchListings.mockResolvedValue({
      content: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        title: `Listing ${i + 1}`,
        price: 100,
        category: 'ANIMALS',
        island: 'São Miguel',
        municipality: 'Ponta Delgada',
        latitude: 37.74,
        longitude: -25.67,
        status: 'ACTIVE',
        photoUrls: [],
        sellerName: 'User',
        createdAt: '2026-03-01T10:00:00Z',
      })),
      totalPages: 3,
      totalElements: 50,
      number: 0,
      size: 20,
      first: true,
      last: false,
    });

    renderWithProviders(<Marketplace />, { route: '/marketplace' });
    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 3/)).toBeInTheDocument();
    });
  });
});
