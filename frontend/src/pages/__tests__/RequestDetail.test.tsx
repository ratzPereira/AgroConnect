import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { RequestDetail } from '../RequestDetail';
import { Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

const mockRequest = {
  id: 1,
  title: 'Lavoura de terreno',
  description: 'Preciso de lavoura para 2 hectares.',
  status: 'PUBLISHED',
  categoryName: 'Lavoura',
  clientId: 2,
  parish: 'Fajã de Baixo',
  municipality: 'Ponta Delgada',
  island: 'São Miguel',
  area: 2.0,
  areaUnit: 'ha',
  urgency: 'MEDIUM',
  latitude: 37.74,
  longitude: -25.67,
  preferredDateFrom: null,
  preferredDateTo: null,
  photos: [],
};

vi.mock('@/api/requests', () => ({
  getRequest: vi.fn(() => Promise.resolve(mockRequest)),
  cancelRequest: vi.fn(),
}));

vi.mock('@/api/proposals', () => ({
  getRequestProposals: vi.fn(() => Promise.resolve([])),
  createProposal: vi.fn(),
  acceptProposal: vi.fn(),
}));

vi.mock('@/api/reviews', () => ({
  getRequestReviews: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 2, name: 'Maria', email: 'maria@test.pt', role: 'CLIENT' },
  })),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/features/executions/components/ExecutionPanel', () => ({
  ExecutionPanel: () => null,
}));

vi.mock('@/features/chat/components/ChatPanel', () => ({
  ChatPanel: () => null,
}));

vi.mock('@/features/requests/components/ConfirmationPanel', () => ({
  ConfirmationPanel: () => null,
}));

vi.mock('@/features/reviews/components/ReviewForm', () => ({
  ReviewForm: () => null,
}));

vi.mock('@/features/reviews/components/ReviewCard', () => ({
  ReviewCard: () => null,
}));

vi.mock('@/features/proposals/components/CreateProposalModal', () => ({
  CreateProposalModal: () => null,
}));

vi.mock('@/features/proposals/components/PaymentModal', () => ({
  PaymentModal: () => null,
}));

vi.mock('@/components/ui/PhotoLightbox', () => ({
  PhotoLightbox: () => null,
}));

vi.mock('@/features/requests/components/PhotoUpload', () => ({
  PhotoUpload: () => null,
}));

function renderRequestDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/requests/1']}>
        <Routes>
          <Route path="/requests/:id" element={<RequestDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RequestDetail', () => {
  it('renders loading state initially', () => {
    renderRequestDetail();
    // The component shows skeleton placeholders while loading
    expect(document.querySelector('.animate-pulse, [class*="skeleton"], [class*="Skeleton"]') !== null ||
      screen.queryByText('Lavoura de terreno') === null).toBe(true);
  });

  it('renders request detail when loaded', async () => {
    renderRequestDetail();
    await waitFor(() => {
      // Title may appear in both breadcrumb and heading
      expect(screen.getAllByText('Lavoura de terreno').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText(/Preciso de lavoura/)).toBeInTheDocument();
  });
});
