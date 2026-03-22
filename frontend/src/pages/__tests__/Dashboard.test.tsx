import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Dashboard } from '../Dashboard';

// Mock the heavy child component to isolate Dashboard page logic
vi.mock('@/features/dashboard/components/ClientDashboard', () => ({
  ClientDashboard: () => <div data-testid="client-dashboard">Dashboard Content</div>,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

const mockUser = { id: 2, name: 'Maria Santos', email: 'maria@test.pt', role: 'CLIENT' as const };

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (state: { user: typeof mockUser | null }) => unknown) =>
    selector({ user: mockUser }),
  ),
}));

function renderDashboard() {
  return renderWithProviders(<Dashboard />, { route: '/dashboard' });
}

describe('Dashboard', () => {
  it('renders greeting with user first name', () => {
    renderDashboard();
    expect(screen.getByText(/Maria/)).toBeInTheDocument();
  });

  it('renders time-based greeting (Bom dia, Boa tarde, or Boa noite)', () => {
    renderDashboard();
    const hour = new Date().getHours();
    let expectedGreeting: string;
    if (hour < 12) expectedGreeting = 'Bom dia';
    else if (hour < 19) expectedGreeting = 'Boa tarde';
    else expectedGreeting = 'Boa noite';
    expect(screen.getByText(new RegExp(expectedGreeting))).toBeInTheDocument();
  });

  it('renders dashboard summary text', () => {
    renderDashboard();
    expect(
      screen.getByText('Aqui está um resumo da sua atividade.'),
    ).toBeInTheDocument();
  });

  it('renders the client dashboard component', () => {
    renderDashboard();
    expect(screen.getByTestId('client-dashboard')).toBeInTheDocument();
  });
});
