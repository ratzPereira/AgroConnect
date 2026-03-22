import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/utils';
import { Requests } from '../Requests';

const mockClientUser = {
  id: 2,
  name: 'Maria Santos',
  email: 'maria@test.pt',
  role: 'CLIENT' as const,
};

// The Requests page calls useAuthStore() with object destructuring { user }
// and also useAuthStore with a direct call returning the full state
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      user: mockClientUser,
      isAuthenticated: true,
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh',
    };
    if (typeof selector === 'function') return selector(state);
    return state;
  }),
}));

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
    useInView: () => true,
  };
});

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderRequests() {
  return renderWithProviders(<Requests />, { route: '/requests' });
}

describe('Requests', () => {
  it('renders page title for client user', async () => {
    renderRequests();
    expect(screen.getByText('Meus Pedidos')).toBeInTheDocument();
  });

  it('renders request cards from API', async () => {
    renderRequests();
    await waitFor(() => {
      expect(
        screen.getByText('Lavoura de terreno para batata-doce'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('Limpeza de terreno abandonado'),
    ).toBeInTheDocument();
  });

  it('shows empty state when no requests', async () => {
    server.use(
      http.get('/api/v1/requests/mine', () =>
        HttpResponse.json({
          content: [],
          totalPages: 0,
          totalElements: 0,
          number: 0,
          size: 20,
          first: true,
          last: true,
        }),
      ),
    );
    renderRequests();
    await waitFor(() => {
      expect(screen.getByText('Ainda sem pedidos')).toBeInTheDocument();
    });
  });

  it('renders create request button for client', () => {
    renderRequests();
    expect(screen.getByText('Novo Pedido')).toBeInTheDocument();
  });
});
