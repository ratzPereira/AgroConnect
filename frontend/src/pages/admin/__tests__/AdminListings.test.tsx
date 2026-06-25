import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';

const mockList = vi.fn();
const mockRemove = vi.fn(() => Promise.resolve());

vi.mock('@/api/admin', () => ({
  listAdminListings: (...a: unknown[]) => mockList(...a),
  removeAdminListing: (...a: unknown[]) => mockRemove(...a),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const page = {
  content: [
    {
      id: 7, title: 'Trator usado', price: 5000, priceNegotiable: true, category: 'EQUIPMENT',
      condition: 'USED', island: 'Terceira', locationName: 'Angra', latitude: 0, longitude: 0,
      firstPhotoUrl: null, createdAt: '2026-06-01T10:00:00Z', status: 'ACTIVE', viewsCount: 3,
    },
  ],
  totalPages: 1, totalElements: 1, number: 0, size: 20, first: true, last: true,
};

describe('AdminListings (moderação)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(page);
  });

  it('renders the moderation table with a listing', async () => {
    const { AdminListings } = await import('../Listings');
    renderWithProviders(<AdminListings />, { route: '/admin/listings' });

    expect(screen.getByText('Moderação de anúncios')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Trator usado')).toBeInTheDocument());
    expect(screen.getByText('€5000.00')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('removes a listing when "Remover" is clicked', async () => {
    const { AdminListings } = await import('../Listings');
    renderWithProviders(<AdminListings />, { route: '/admin/listings' });

    await waitFor(() => expect(screen.getByText('Trator usado')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Remover/i }));

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith(7));
  });

  it('shows empty state when there are no listings', async () => {
    mockList.mockResolvedValue({ ...page, content: [], totalElements: 0 });
    const { AdminListings } = await import('../Listings');
    renderWithProviders(<AdminListings />, { route: '/admin/listings' });

    await waitFor(() => expect(screen.getByText(/Sem anúncios para mostrar/i)).toBeInTheDocument());
  });
});
