import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import type { ServiceRequestResponse } from '@/types/request';
import type { ProposalResponse } from '@/types/proposal';

/* ── Hoisted mock state (available inside vi.mock factories) ── */

const {
  mockGetRequest,
  mockGetRequestProposals,
  mockGetRequestReviews,
  mockCancelRequest,
  state,
} = vi.hoisted(() => {
  const mockGetRequest = vi.fn();
  const mockGetRequestProposals = vi.fn();
  const mockGetRequestReviews = vi.fn();
  const mockCancelRequest = vi.fn();
  const state = {
    request: null as ServiceRequestResponse | null,
    proposals: [] as Partial<ProposalResponse>[],
    reviews: [] as unknown[],
    user: null as { id: number; name: string; email: string; role: string } | null,
  };
  return { mockGetRequest, mockGetRequestProposals, mockGetRequestReviews, mockCancelRequest, state };
});

/* ── Data ────────────────────────────────────────────────── */

const baseRequest: ServiceRequestResponse = {
  id: 1,
  title: 'Lavoura de terreno',
  description: 'Preciso de lavoura para 2 hectares.',
  status: 'PUBLISHED',
  categoryId: 1,
  categoryName: 'Lavoura',
  clientId: 2,
  clientName: 'Maria',
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
  formData: null,
  expiresAt: null,
  photos: [],
  proposalCount: 0,
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-03-01T10:00:00Z',
};

/* ── Mocks ───────────────────────────────────────────────── */

vi.mock('@/api/requests', () => ({
  getRequest: (...args: unknown[]) => mockGetRequest(...args),
  cancelRequest: (...args: unknown[]) => mockCancelRequest(...args),
}));

vi.mock('@/api/proposals', () => ({
  getRequestProposals: (...args: unknown[]) => mockGetRequestProposals(...args),
  createProposal: vi.fn(() => Promise.resolve()),
  acceptProposal: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/api/reviews', () => ({
  getRequestReviews: (...args: unknown[]) => mockGetRequestReviews(...args),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ user: state.user })),
}));

import { RequestDetail } from '../RequestDetail';
import { useAuthStore } from '@/stores/authStore';

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/Breadcrumbs', () => ({
  Breadcrumbs: ({ items }: { items: Array<{ label: string; to?: string }>; className?: string }) => (
    <nav data-testid="breadcrumbs">
      {items.map((item) => (
        <span key={item.label}>{item.label}</span>
      ))}
    </nav>
  ),
}));

vi.mock('@/components/ui/StatusTimeline', () => ({
  StatusTimeline: ({
    steps,
  }: {
    steps: Array<{ label: string; status: string }>;
  }) => (
    <div data-testid="status-timeline">
      {steps.map((s) => (
        <span key={s.label} data-status={s.status}>
          {s.label}
        </span>
      ))}
    </div>
  ),
}));

vi.mock('@/components/ui/Skeleton', () => {
  const Line = ({ className }: { className?: string }) => (
    <div data-testid="skeleton-line" className={className} />
  );
  const Rect = ({ className }: { className?: string }) => (
    <div data-testid="skeleton-rect" className={className} />
  );
  const Card = () => <div data-testid="skeleton-card" />;
  const Base = ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  );
  return {
    Skeleton: Object.assign(Base, { Line, Rect, Card }),
  };
});

vi.mock('@/components/ui/PhotoLightbox', () => ({
  PhotoLightbox: () => null,
}));

vi.mock('@/features/requests/components/RequestStatusBadge', () => ({
  RequestStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

vi.mock('@/features/proposals/components/ProposalCard', () => ({
  ProposalCard: ({
    proposal,
  }: {
    proposal: { id: number; providerName: string };
    isRequestOwner: boolean;
    onAccept: (id: number) => void;
    acceptLoading: boolean;
  }) => <div data-testid="proposal-card">{proposal.providerName}</div>,
}));

vi.mock('@/features/proposals/components/CreateProposalModal', () => ({
  CreateProposalModal: () => null,
}));

vi.mock('@/features/proposals/components/PaymentModal', () => ({
  PaymentModal: () => null,
}));

vi.mock('@/features/executions/components/ExecutionPanel', () => ({
  ExecutionPanel: () => <div data-testid="execution-panel">ExecutionPanel</div>,
}));

vi.mock('@/features/chat/components/ChatPanel', () => ({
  ChatPanel: () => <div data-testid="chat-panel">ChatPanel</div>,
}));

vi.mock('@/features/requests/components/ConfirmationPanel', () => ({
  ConfirmationPanel: () => <div data-testid="confirmation-panel">ConfirmationPanel</div>,
}));

vi.mock('@/features/reviews/components/ReviewForm', () => ({
  ReviewForm: () => <div data-testid="review-form">ReviewForm</div>,
}));

vi.mock('@/features/reviews/components/ReviewCard', () => ({
  ReviewCard: ({ review }: { review: { id: number; comment: string } }) => (
    <div data-testid="review-card">{review.comment}</div>
  ),
}));

vi.mock('@/features/requests/components/PhotoUpload', () => ({
  PhotoUpload: () => <div data-testid="photo-upload">PhotoUpload</div>,
}));

/* ── Helpers ─────────────────────────────────────────────── */

function renderRequestDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
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

/* ── Tests ───────────────────────────────────────────────── */

describe('RequestDetail — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.request = { ...baseRequest };
    state.proposals = [];
    state.reviews = [];
    state.user = { id: 2, name: 'Maria', email: 'maria@test.pt', role: 'CLIENT' };
    mockGetRequest.mockImplementation(() => Promise.resolve(state.request));
    mockGetRequestProposals.mockImplementation(() => Promise.resolve(state.proposals));
    mockGetRequestReviews.mockImplementation(() => Promise.resolve(state.reviews));
    mockCancelRequest.mockImplementation(() => Promise.resolve(baseRequest));
    vi.mocked(useAuthStore).mockImplementation(() => ({ user: state.user }) as ReturnType<typeof useAuthStore>);
  });

  it('shows loading skeleton when isLoading', () => {
    mockGetRequest.mockReturnValue(new Promise(() => {}));
    renderRequestDetail();
    const skeletons = screen.getAllByTestId('skeleton-line');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows the 404 page when request is null', async () => {
    mockGetRequest.mockResolvedValue(null);
    renderRequestDetail();
    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText(/Página não encontrada/)).toBeInTheDocument();
    });
  });

  it('renders request title', async () => {
    renderRequestDetail();
    await waitFor(() => {
      const titles = screen.getAllByText('Lavoura de terreno');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders description text', async () => {
    renderRequestDetail();
    await waitFor(() => {
      expect(
        screen.getByText('Preciso de lavoura para 2 hectares.'),
      ).toBeInTheDocument();
    });
  });

  it('renders category name', async () => {
    renderRequestDetail();
    await waitFor(() => {
      expect(screen.getByText('Lavoura')).toBeInTheDocument();
    });
  });

  it('renders urgency label', async () => {
    renderRequestDetail();
    await waitFor(() => {
      expect(screen.getByText(/Urgência: Média/)).toBeInTheDocument();
    });
  });

  it('shows "Propostas (N)" heading with count', async () => {
    state.proposals = [
      {
        id: 10,
        providerName: 'AgroServiços',
        price: 200,
        status: 'PENDING',
        requestId: 1,
        providerId: 3,
      },
      {
        id: 11,
        providerName: 'TerraFirme',
        price: 180,
        status: 'PENDING',
        requestId: 1,
        providerId: 4,
      },
    ];
    mockGetRequestProposals.mockResolvedValue(state.proposals);
    renderRequestDetail();
    await waitFor(() => {
      expect(screen.getByText('Propostas (2)')).toBeInTheDocument();
    });
  });

  it('shows "Ainda não existem propostas" when proposals list is empty', async () => {
    renderRequestDetail();
    await waitFor(() => {
      expect(
        screen.getByText('Ainda não existem propostas para este pedido.'),
      ).toBeInTheDocument();
    });
  });

  it('shows "Submeter Proposta" for provider user on PUBLISHED request', async () => {
    state.user = { id: 99, name: 'Agro Provider', email: 'prov@test.pt', role: 'PROVIDER_MANAGER' };
    renderRequestDetail();
    await waitFor(() => {
      expect(screen.getByText('Submeter Proposta')).toBeInTheDocument();
    });
  });

  it('shows "Cancelar" for request owner', async () => {
    renderRequestDetail();
    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });
  });

  it('shows Progresso timeline', async () => {
    renderRequestDetail();
    await waitFor(() => {
      expect(screen.getByText('Progresso')).toBeInTheDocument();
    });
    expect(screen.getByTestId('status-timeline')).toBeInTheDocument();
  });

  it('hides "Submeter Proposta" for non-provider user', async () => {
    state.user = { id: 99, name: 'Cliente', email: 'client@test.pt', role: 'CLIENT' };
    renderRequestDetail();
    await waitFor(() => {
      const titles = screen.getAllByText('Lavoura de terreno');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.queryByText('Submeter Proposta')).not.toBeInTheDocument();
  });
});
