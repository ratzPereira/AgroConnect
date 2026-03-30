import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Requests } from '../Requests';

/* ── Mocks ───────────────────────────────────────────────── */

const mockGetMyRequests = vi.fn();
const mockGetAvailableRequests = vi.fn();
const mockUseAuthStore = vi.fn();

vi.mock('@/api/requests', () => ({
  getMyRequests: (...args: unknown[]) => mockGetMyRequests(...args),
  getAvailableRequests: (...args: unknown[]) => mockGetAvailableRequests(...args),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (...args: unknown[]) => mockUseAuthStore(...args),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { variants: _v, initial: _i, animate: _a, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  useReducedMotion: () => true,
}));

vi.mock('@/hooks/useMotionConfig', () => ({
  useMotionConfig: () => ({
    listContainerVariants: {},
    listItemVariants: {},
  }),
}));

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: Object.assign(
    ({ children, ...props }: Record<string, unknown>) => <div data-testid="skeleton" {...props}>{children as React.ReactNode}</div>,
    {
      Stat: () => <div data-testid="skeleton-stat" />,
      Table: () => <div data-testid="skeleton-table" />,
      Card: () => <div data-testid="skeleton-card" />,
    },
  ),
}));

vi.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      {description && <span>{description}</span>}
      {action && <div>{action}</div>}
    </div>
  ),
}));

vi.mock('@/components/illustrations/EmptyRequests', () => ({
  EmptyRequests: () => <svg data-testid="empty-illustration" />,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/features/requests/components/RequestCard', () => ({
  RequestCard: ({ request }: { request: { id: number; title: string } }) => (
    <div data-testid={`request-${request.id}`}>{request.title}</div>
  ),
}));

vi.mock('@/features/requests/components/RequestFilters', () => ({
  RequestFilters: () => <div data-testid="request-filters" />,
}));

vi.mock('@/features/requests/components/RequestMapView', () => ({
  RequestMapView: () => <div data-testid="request-map" />,
}));

vi.mock('@/utils/cn', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

/* ── Test data ───────────────────────────────────────────── */

const requestsList = {
  content: [
    {
      id: 1,
      categoryName: 'Lavoura',
      status: 'PUBLISHED',
      title: 'Lavoura de terreno para batata-doce',
      parish: 'Arrifes',
      municipality: 'Ponta Delgada',
      island: 'São Miguel',
      area: 2.0,
      areaUnit: 'hectares',
      urgency: 'MEDIUM',
      proposalCount: 3,
      createdAt: '2026-03-15T10:00:00Z',
    },
    {
      id: 2,
      categoryName: 'Limpeza',
      status: 'DRAFT',
      title: 'Limpeza de terreno abandonado',
      parish: 'Fajã de Baixo',
      municipality: 'Ponta Delgada',
      island: 'São Miguel',
      area: 0.5,
      areaUnit: 'hectares',
      urgency: 'LOW',
      proposalCount: 0,
      createdAt: '2026-03-18T14:00:00Z',
    },
  ],
  totalPages: 1,
  totalElements: 2,
  number: 0,
  size: 20,
  first: true,
  last: true,
};

const emptyPage = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  number: 0,
  size: 20,
  first: true,
  last: true,
};

const multiPageRequests = {
  content: [
    {
      id: 1,
      categoryName: 'Lavoura',
      status: 'PUBLISHED',
      title: 'Lavoura de terreno',
      parish: 'Arrifes',
      municipality: 'Ponta Delgada',
      island: 'São Miguel',
      area: 2.0,
      areaUnit: 'hectares',
      urgency: 'MEDIUM',
      proposalCount: 0,
      createdAt: '2026-03-15T10:00:00Z',
    },
  ],
  totalPages: 5,
  totalElements: 100,
  number: 0,
  size: 20,
  first: true,
  last: false,
};

/* ── Helpers ─────────────────────────────────────────────── */

function setClientRole() {
  mockUseAuthStore.mockImplementation((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = { user: { id: 1, role: 'CLIENT', name: 'Maria' }, isAuthenticated: true };
    if (typeof selector === 'function') return selector(state);
    return state;
  });
}

function setProviderRole() {
  mockUseAuthStore.mockImplementation((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = { user: { id: 2, role: 'PROVIDER_MANAGER', name: 'Carlos' }, isAuthenticated: true };
    if (typeof selector === 'function') return selector(state);
    return state;
  });
}

/* ── Tests ───────────────────────────────────────────────── */

describe('Requests — deeper coverage (CLIENT)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setClientRole();
  });

  it('renders title "Meus Pedidos" for client', () => {
    mockGetMyRequests.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Requests />, { route: '/requests' });
    expect(screen.getByText('Meus Pedidos')).toBeInTheDocument();
  });

  it('shows "Novo Pedido" button for client', () => {
    mockGetMyRequests.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Requests />, { route: '/requests' });
    expect(screen.getByText('Novo Pedido')).toBeInTheDocument();
  });

  it('shows status filter pills for client', () => {
    mockGetMyRequests.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Requests />, { route: '/requests' });

    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('Publicado')).toBeInTheDocument();
    expect(screen.getByText('Com Propostas')).toBeInTheDocument();
    expect(screen.getByText('Adjudicado')).toBeInTheDocument();
    expect(screen.getByText('Em Curso')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('renders empty state "Ainda sem pedidos" for client', async () => {
    mockGetMyRequests.mockResolvedValue(emptyPage);
    renderWithProviders(<Requests />, { route: '/requests' });

    await waitFor(() => {
      expect(screen.getByText('Ainda sem pedidos')).toBeInTheDocument();
    });
  });

  it('renders request cards for client', async () => {
    mockGetMyRequests.mockResolvedValue(requestsList);
    renderWithProviders(<Requests />, { route: '/requests' });

    await waitFor(() => {
      expect(screen.getByTestId('request-1')).toBeInTheDocument();
    });
    expect(screen.getByText('Lavoura de terreno para batata-doce')).toBeInTheDocument();
    expect(screen.getByText('Limpeza de terreno abandonado')).toBeInTheDocument();
  });

  it('shows loading state with skeleton cards', () => {
    mockGetMyRequests.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Requests />, { route: '/requests' });

    const skeletonCards = screen.getAllByTestId('skeleton-card');
    expect(skeletonCards).toHaveLength(6);
  });

  it('shows pagination when totalPages > 1', async () => {
    mockGetMyRequests.mockResolvedValue(multiPageRequests);
    renderWithProviders(<Requests />, { route: '/requests' });

    await waitFor(() => {
      expect(screen.getByText('Lavoura de terreno')).toBeInTheDocument();
    });

    expect(screen.getByText('Anterior')).toBeInTheDocument();
    expect(screen.getByText('Seguinte')).toBeInTheDocument();
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });
});

describe('Requests — deeper coverage (PROVIDER)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setProviderRole();
  });

  it('renders title "Pedidos Disponiveis" for provider', () => {
    mockGetAvailableRequests.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Requests />, { route: '/requests' });
    expect(screen.getByText('Pedidos Disponíveis')).toBeInTheDocument();
  });

  it('shows list/map toggle for provider', () => {
    mockGetAvailableRequests.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Requests />, { route: '/requests' });

    expect(screen.getByText('Lista')).toBeInTheDocument();
    expect(screen.getByText('Mapa')).toBeInTheDocument();
  });

  it('renders empty state "Sem pedidos disponiveis" for provider', async () => {
    mockGetAvailableRequests.mockResolvedValue(emptyPage);
    renderWithProviders(<Requests />, { route: '/requests' });

    await waitFor(() => {
      expect(screen.getByText('Sem pedidos disponíveis')).toBeInTheDocument();
    });
  });
});
