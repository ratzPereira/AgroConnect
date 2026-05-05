import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { ListingDetail } from '../ListingDetail';

const mockListing = {
  id: 1,
  title: 'Trator John Deere 5085M',
  description: 'Trator em excelente estado, pouco uso.',
  price: 25000,
  priceNegotiable: true,
  category: 'EQUIPMENT' as const,
  condition: 'USED' as const,
  status: 'ACTIVE' as const,
  quantity: null,
  unit: null,
  island: 'São Miguel',
  municipality: 'Ponta Delgada',
  parish: null,
  locationName: null,
  latitude: 37.74,
  longitude: -25.67,
  photoUrls: [],
  sellerId: 5,
  sellerName: 'Fazenda dos Açores',
  sellerRating: 4.5,
  sellerListingCount: 3,
  favoriteCount: 12,
  favorited: false,
  viewsCount: 89,
  createdAt: '2026-03-01T10:00:00Z',
};

vi.mock('@/api/listings', () => ({
  getListingById: vi.fn(() => Promise.resolve(mockListing)),
  markListingSold: vi.fn(),
  removeListing: vi.fn(),
  toggleFavorite: vi.fn(),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 2, name: 'Maria', email: 'maria@test.pt', role: 'CLIENT' },
  })),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/listings/components/ListingPhotoGallery', () => ({
  ListingPhotoGallery: () => <div data-testid="photo-gallery" />,
}));

vi.mock('@/features/listings/components/ListingChatPanel', () => ({
  ListingChatPanel: () => null,
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="leaflet-map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
  },
}));

function renderListingDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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

describe('ListingDetail', () => {
  it('renders loading state initially', () => {
    renderListingDetail();
    // While loading, listing title should not yet be visible
    expect(screen.queryByText('Trator John Deere 5085M')).not.toBeInTheDocument();
  });

  it('renders listing detail when loaded', async () => {
    renderListingDetail();
    await waitFor(() => {
      // Title appears in both breadcrumb and heading
      expect(screen.getAllByText('Trator John Deere 5085M').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('Trator em excelente estado, pouco uso.')).toBeInTheDocument();
  });
});
