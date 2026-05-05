import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { ListingDetail } from '../ListingDetail';
import type { Listing } from '@/types/listing';

/* ── Hoisted mutable state ───────────────────────────────── */

const { mockState } = vi.hoisted(() => {
  const baseListing: Listing = {
    id: 1,
    title: 'Trator John Deere 5085M',
    description: 'Trator em excelente estado, pouco uso.',
    price: 25000,
    priceNegotiable: true,
    category: 'ANIMALS',
    condition: 'USED',
    status: 'ACTIVE',
    quantity: null,
    unit: null,
    island: 'São Miguel',
    municipality: 'Ponta Delgada',
    parish: null,
    locationName: null,
    latitude: 37.74,
    longitude: -25.67,
    photoUrls: ['photo1.jpg', 'photo2.jpg'],
    sellerId: 5,
    sellerName: 'Fazenda dos Açores',
    sellerRating: 4.5,
    sellerListingCount: 3,
    favoriteCount: 12,
    favorited: false,
    viewsCount: 89,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    expiresAt: null,
  };

  return {
    mockState: {
      baseListing,
      listing: baseListing as Listing | null,
      user: { id: 2, name: 'Maria', email: 'maria@test.pt', role: 'CLIENT' } as {
        id: number;
        name: string;
        email: string;
        role: string;
      } | null,
      getListingByIdImpl: (() => Promise.resolve(baseListing)) as () => Promise<Listing | null>,
    },
  };
});

/* ── Mocks ───────────────────────────────────────────────── */

vi.mock('@/api/listings', () => ({
  getListingById: vi.fn((..._args: unknown[]) => mockState.getListingByIdImpl()),
  markListingSold: vi.fn(() => Promise.resolve(mockState.baseListing)),
  removeListing: vi.fn(() => Promise.resolve()),
  toggleFavorite: vi.fn(() => Promise.resolve({ favorited: true })),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ user: mockState.user })),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/listings/components/ListingPhotoGallery', () => ({
  ListingPhotoGallery: ({ photos }: { photos: string[] }) => (
    <div data-testid="photo-gallery">{photos.length} photos</div>
  ),
}));

vi.mock('@/features/listings/components/ListingChatPanel', () => ({
  ListingChatPanel: ({ open }: { open: boolean }) =>
    open ? <div data-testid="chat-panel">Chat Open</div> : null,
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({
    open,
    children,
    title,
  }: {
    open: boolean;
    onClose: () => void;
    title?: string;
    size?: string;
    children: React.ReactNode;
  }) => (open ? <div data-testid="modal" aria-label={title}>{children}</div> : null),
}));

vi.mock('@/components/ui/Skeleton', () => {
  const Line = ({ className }: { className?: string }) => (
    <div data-testid="skeleton-line" className={className} />
  );
  const Card = () => <div data-testid="skeleton-card" />;
  const Base = ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  );
  return {
    Skeleton: Object.assign(Base, { Line, Card }),
  };
});

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-map">{children}</div>
  ),
  TileLayer: () => null,
  Marker: () => null,
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
  },
}));

/* ── Helpers ─────────────────────────────────────────────── */

function renderListingDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/marketplace/1']}>
        <Routes>
          <Route path="/marketplace/:id" element={<ListingDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/* ── Tests ───────────────────────────────────────────────── */

describe('ListingDetail — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.listing = { ...mockState.baseListing };
    mockState.user = { id: 2, name: 'Maria', email: 'maria@test.pt', role: 'CLIENT' };
    mockState.getListingByIdImpl = () => Promise.resolve(mockState.listing);
  });

  it('shows loading skeleton when isLoading', () => {
    mockState.getListingByIdImpl = () => new Promise(() => {});
    renderListingDetail();
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Anúncio não encontrado" when listing is null', async () => {
    mockState.getListingByIdImpl = () => Promise.resolve(null);
    renderListingDetail();
    await waitFor(() => {
      expect(screen.getByText(/Anúncio não encontrado/)).toBeInTheDocument();
    });
  });

  it('renders listing title', async () => {
    renderListingDetail();
    await waitFor(() => {
      expect(screen.getAllByText('Trator John Deere 5085M').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders formatted price with currency symbol', async () => {
    renderListingDetail();
    await waitFor(() => {
      expect(screen.getByText(/25.*€/)).toBeInTheDocument();
    });
  });

  it('renders "Preço sob consulta" when price is null', async () => {
    mockState.listing = { ...mockState.baseListing, price: null };
    renderListingDetail();
    await waitFor(() => {
      expect(screen.getByText('Preço sob consulta')).toBeInTheDocument();
    });
  });

  it('renders "Negociável" badge when priceNegotiable is true', async () => {
    renderListingDetail();
    await waitFor(() => {
      expect(screen.getByText('Negociável')).toBeInTheDocument();
    });
  });

  it('renders category badge', async () => {
    renderListingDetail();
    await waitFor(() => {
      expect(screen.getByText('Animais')).toBeInTheDocument();
    });
  });

  it('renders condition badge', async () => {
    renderListingDetail();
    await waitFor(() => {
      expect(screen.getByText('Usado')).toBeInTheDocument();
    });
  });

  it('renders description text', async () => {
    renderListingDetail();
    await waitFor(() => {
      expect(
        screen.getByText('Trator em excelente estado, pouco uso.'),
      ).toBeInTheDocument();
    });
  });

  it('renders seller name and initials avatar', async () => {
    renderListingDetail();
    await waitFor(() => {
      expect(screen.getByText('Fazenda dos Açores')).toBeInTheDocument();
    });
    // Initials: "Fazenda dos Açores" -> "F","D","A" -> "FDA" -> slice(0,2) -> "FD"
    expect(screen.getByText('FD')).toBeInTheDocument();
  });

  it('owner sees "Marcar como Vendido" button', async () => {
    mockState.user = { id: 5, name: 'Fazenda', email: 'fazenda@test.pt', role: 'CLIENT' };
    renderListingDetail();
    await waitFor(() => {
      expect(screen.getByText('Marcar como Vendido')).toBeInTheDocument();
    });
  });

  it('owner sees "Remover" button', async () => {
    mockState.user = { id: 5, name: 'Fazenda', email: 'fazenda@test.pt', role: 'CLIENT' };
    renderListingDetail();
    await waitFor(() => {
      expect(screen.getByText('Remover')).toBeInTheDocument();
    });
  });

  it('non-owner sees "Contactar Vendedor" button', async () => {
    renderListingDetail();
    await waitFor(() => {
      expect(screen.getByText('Contactar Vendedor')).toBeInTheDocument();
    });
  });

  it('non-owner sees "Favoritar" button', async () => {
    renderListingDetail();
    await waitFor(() => {
      expect(screen.getByText('Favoritar')).toBeInTheDocument();
    });
  });
});
