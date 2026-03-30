import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewList } from '../ReviewList';
import { mockReview } from '@/test/mocks/data';

// Mock the API module
vi.mock('@/api/reviews', () => ({
  getProviderReviews: vi.fn(),
}));

// Mock ReviewCard to isolate ReviewList logic
vi.mock('../ReviewCard', () => ({
  ReviewCard: ({ review }: { review: { id: number; authorName: string } }) => (
    <div data-testid={`review-${review.id}`}>{review.authorName}</div>
  ),
}));

import { getProviderReviews } from '@/api/reviews';
const mockGetProviderReviews = vi.mocked(getProviderReviews);

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('ReviewList', () => {
  it('renders loading state initially', () => {
    // Never resolve so it stays loading
    mockGetProviderReviews.mockReturnValue(new Promise(() => {}));
    renderWithQueryClient(<ReviewList providerId={1} />);
    // Loader2 renders as an SVG with animate-spin
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });

  it('renders empty state when no reviews', async () => {
    mockGetProviderReviews.mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 10,
      first: true,
      last: true,
    });

    renderWithQueryClient(<ReviewList providerId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Este prestador ainda não tem avaliações.')).toBeInTheDocument();
    });
  });

  it('renders list of reviews', async () => {
    const reviews = [
      { ...mockReview, id: 1, authorName: 'Ana Ferreira' },
      { ...mockReview, id: 2, authorName: 'Carlos Silva' },
    ];
    mockGetProviderReviews.mockResolvedValue({
      content: reviews,
      totalPages: 1,
      totalElements: 2,
      number: 0,
      size: 10,
      first: true,
      last: true,
    });

    renderWithQueryClient(<ReviewList providerId={1} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-1')).toBeInTheDocument();
      expect(screen.getByTestId('review-2')).toBeInTheDocument();
      expect(screen.getByText('Ana Ferreira')).toBeInTheDocument();
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });
  });

  it('does not show pagination for single page', async () => {
    mockGetProviderReviews.mockResolvedValue({
      content: [mockReview],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 10,
      first: true,
      last: true,
    });

    renderWithQueryClient(<ReviewList providerId={1} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-1')).toBeInTheDocument();
    });
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
    expect(screen.queryByText('Seguinte')).not.toBeInTheDocument();
  });

  it('shows pagination controls for multiple pages', async () => {
    mockGetProviderReviews.mockResolvedValue({
      content: [mockReview],
      totalPages: 3,
      totalElements: 25,
      number: 0,
      size: 10,
      first: true,
      last: false,
    });

    renderWithQueryClient(<ReviewList providerId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Anterior')).toBeInTheDocument();
      expect(screen.getByText('Seguinte')).toBeInTheDocument();
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });
});
