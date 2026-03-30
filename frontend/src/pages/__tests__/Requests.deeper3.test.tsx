import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Requests } from '../Requests';
import type { ServiceRequestSummary, Page } from '@/types/request';
import type { UserResponse } from '@/types/auth';

// ---------------------------------------------------------------------------
// Mock user data
// ---------------------------------------------------------------------------
const clientUser: UserResponse = {
  id: 1,
  name: 'Maria Santos',
  email: 'maria@test.pt',
  role: 'CLIENT',
};

const providerUser: UserResponse = {
  id: 2,
  name: 'João Provider',
  email: 'joao@test.pt',
  role: 'PROVIDER_MANAGER',
};

let mockUser: UserResponse | null = clientUser;

// ---------------------------------------------------------------------------
// Mock stores
// ---------------------------------------------------------------------------
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      user: mockUser,
      isAuthenticated: true,
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
    };
    if (typeof selector === 'function') return selector(state);
    return state;
  }),
}));

// ---------------------------------------------------------------------------
// Mock API
// ---------------------------------------------------------------------------
const sampleRequests: ServiceRequestSummary[] = [
  {
    id: 1,
    categoryName: 'Lavoura',
    status: 'PUBLISHED',
    title: 'Lavoura de terreno para batata-doce',
    parish: 'Arrifes',
    municipality: 'Ponta Delgada',
    island: 'São Miguel',
    area: 2.5,
    areaUnit: 'ha',
    urgency: 'MEDIUM',
    proposalCount: 3,
    createdAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 2,
    categoryName: 'Limpeza',
    status: 'DRAFT',
    title: 'Limpeza de terreno abandonado',
    parish: 'Fajã de Baixo',
    municipality: 'Ponta Delgada',
    island: 'São Miguel',
    area: 1.0,
    areaUnit: 'ha',
    urgency: 'LOW',
    proposalCount: 0,
    createdAt: '2026-03-19T08:00:00Z',
  },
];

function makePage(
  content: ServiceRequestSummary[],
  overrides: Partial<Page<ServiceRequestSummary>> = {},
): Page<ServiceRequestSummary> {
  return {
    content,
    totalPages: 1,
    totalElements: content.length,
    number: 0,
    size: 20,
    first: true,
    last: true,
    ...overrides,
  };
}

const mockGetMyRequests = vi.fn(() => Promise.resolve(makePage(sampleRequests)));
const mockGetAvailableRequests = vi.fn(() => Promise.resolve(makePage(sampleRequests)));

vi.mock('@/api/requests', () => ({
  getMyRequests: (...args: unknown[]) => mockGetMyRequests(...args),
  getAvailableRequests: (...args: unknown[]) => mockGetAvailableRequests(...args),
}));

// ---------------------------------------------------------------------------
// Mock UI dependencies to isolate the component under test
// ---------------------------------------------------------------------------
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { variants, initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
  useInView: () => true,
}));

vi.mock('@/hooks/useMotionConfig', () => ({
  useMotionConfig: () => ({
    pageVariants: {},
    pageTransition: {},
    listContainerVariants: {},
    listItemVariants: {},
    fadeInVariants: {},
    shouldAnimate: false,
  }),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: Object.assign(
    ({ className }: { className?: string }) => (
      <div data-testid="skeleton" className={className} />
    ),
    {
      Card: () => <div data-testid="skeleton-card" />,
      Line: () => <div data-testid="skeleton-line" />,
      Circle: () => <div data-testid="skeleton-circle" />,
      Rect: () => <div data-testid="skeleton-rect" />,
    },
  ),
}));

vi.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title, description }: { title: string; description?: string }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  ),
}));

vi.mock('@/components/illustrations/EmptyRequests', () => ({
  EmptyRequests: () => <svg data-testid="empty-requests-illustration" />,
}));

vi.mock('@/features/requests/components/RequestCard', () => ({
  RequestCard: ({ request }: { request: ServiceRequestSummary }) => (
    <div data-testid={`request-card-${request.id}`}>{request.title}</div>
  ),
}));

vi.mock('@/features/requests/components/RequestFilters', () => ({
  RequestFilters: ({ onFilterChange }: { filters: Record<string, string>; onFilterChange: (f: Record<string, string>) => void }) => (
    <div data-testid="request-filters">
      <button onClick={() => onFilterChange({ search: '', urgency: '', island: '' })}>
        Apply
      </button>
    </div>
  ),
}));

vi.mock('@/features/requests/components/RequestMapView', () => ({
  RequestMapView: () => <div data-testid="request-map-view">Map</div>,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Requests page (deeper3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = clientUser;
    mockGetMyRequests.mockResolvedValue(makePage(sampleRequests));
    mockGetAvailableRequests.mockResolvedValue(makePage(sampleRequests));
  });

  function renderPage(route = '/requests') {
    return renderWithProviders(<Requests />, { route });
  }

  // 1. Title for CLIENT
  it('renders "Meus Pedidos" title for CLIENT role', () => {
    mockUser = clientUser;
    renderPage();
    expect(screen.getByText('Meus Pedidos')).toBeInTheDocument();
  });

  // 2. Title for PROVIDER
  it('renders "Pedidos Disponíveis" title for PROVIDER role', () => {
    mockUser = providerUser;
    renderPage();
    expect(screen.getByText('Pedidos Disponíveis')).toBeInTheDocument();
  });

  // 3. "Novo Pedido" button visible for CLIENT
  it('shows "Novo Pedido" button for CLIENT role', () => {
    mockUser = clientUser;
    renderPage();
    expect(screen.getByText('Novo Pedido')).toBeInTheDocument();
  });

  // 4. "Novo Pedido" button hidden for PROVIDER
  it('hides "Novo Pedido" button for PROVIDER role', () => {
    mockUser = providerUser;
    renderPage();
    expect(screen.queryByText('Novo Pedido')).not.toBeInTheDocument();
  });

  // 5. Loading skeleton
  it('shows loading skeletons while data is loading', () => {
    // Return a promise that never resolves to keep the loading state
    mockGetMyRequests.mockReturnValue(new Promise(() => {}));
    mockUser = clientUser;
    renderPage();
    const skeletons = screen.getAllByTestId('skeleton-card');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // 6. Empty state when no requests (client)
  it('shows empty state when no requests for CLIENT', async () => {
    mockGetMyRequests.mockResolvedValue(makePage([]));
    mockUser = clientUser;
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Ainda sem pedidos')).toBeInTheDocument();
    });
  });

  // 7. Request cards rendered
  it('renders request cards when data exists', async () => {
    mockUser = clientUser;
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('request-card-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('request-card-2')).toBeInTheDocument();
    expect(screen.getByText('Lavoura de terreno para batata-doce')).toBeInTheDocument();
    expect(screen.getByText('Limpeza de terreno abandonado')).toBeInTheDocument();
  });

  // 8. Status filter tabs for CLIENT
  it('renders status filter tabs for CLIENT role', () => {
    mockUser = clientUser;
    renderPage();
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('Publicado')).toBeInTheDocument();
    expect(screen.getByText('Com Propostas')).toBeInTheDocument();
    expect(screen.getByText('Adjudicado')).toBeInTheDocument();
    expect(screen.getByText('Em Curso')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  // 9. Pagination controls shown for multiple pages
  it('shows pagination buttons when totalPages > 1', async () => {
    mockGetMyRequests.mockResolvedValue(
      makePage(sampleRequests, {
        totalPages: 3,
        number: 0,
        first: true,
        last: false,
      }),
    );
    mockUser = clientUser;
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Anterior')).toBeInTheDocument();
    });
    expect(screen.getByText('Seguinte')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  // 10. List/map toggle for PROVIDER
  it('renders list/map toggle buttons for PROVIDER role', () => {
    mockUser = providerUser;
    renderPage();
    expect(screen.getByText('Lista')).toBeInTheDocument();
    expect(screen.getByText('Mapa')).toBeInTheDocument();
  });
});
