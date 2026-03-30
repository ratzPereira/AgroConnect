import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ServiceExecution, ExecutionAssignment, ExecutionPhoto } from '@/types/execution';
import type { RequestStatus } from '@/types/request';

// ── Mock child components ──────────────────────────────────────────────────
vi.mock('../AssignmentForm', () => ({
  AssignmentForm: () => <div data-testid="assignment-form" />,
}));
vi.mock('../CheckinButton', () => ({
  CheckinButton: () => <div data-testid="checkin-button" />,
}));
vi.mock('../ExecutionPhotoUpload', () => ({
  ExecutionPhotoUpload: () => <div data-testid="photo-upload" />,
}));
vi.mock('../DistanceIndicator', () => ({
  DistanceIndicator: () => <div data-testid="distance-indicator" />,
}));
vi.mock('../CheckinMap', () => ({
  CheckinMap: () => <div data-testid="checkin-map" />,
}));

// ── Mock date-fns ──────────────────────────────────────────────────────────
vi.mock('date-fns', () => ({
  format: vi.fn(() => '15/03/2026 10:30'),
}));

// ── Mock API ───────────────────────────────────────────────────────────────
vi.mock('@/api/executions', () => ({
  getExecutionByRequest: vi.fn(),
  completeExecution: vi.fn(),
}));

// ── React Query mock ───────────────────────────────────────────────────────
const mockMutate = vi.fn();

let mockQueryReturn: { data: ServiceExecution | null; isLoading: boolean };
let mockMutationReturn: {
  mutate: typeof mockMutate;
  isPending: boolean;
  isError: boolean;
  error: unknown;
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => mockQueryReturn),
  useMutation: vi.fn(() => mockMutationReturn),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

import { ExecutionPanel } from '../ExecutionPanel';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeAssignment(overrides: Partial<ExecutionAssignment> = {}): ExecutionAssignment {
  return {
    id: 1,
    teamMemberId: 10,
    teamMemberName: 'João Silva',
    teamMemberRole: 'OPERATOR',
    machineId: null,
    machineName: null,
    assignedAt: '2026-03-15T09:00:00Z',
    ...overrides,
  };
}

function makePhoto(overrides: Partial<ExecutionPhoto> = {}): ExecutionPhoto {
  return {
    id: 1,
    photoUrl: 'https://cdn.example.com/photo1.jpg',
    latitude: null,
    longitude: null,
    takenAt: null,
    uploadedAt: '2026-03-15T12:00:00Z',
    ...overrides,
  };
}

function makeExecution(overrides: Partial<ServiceExecution> = {}): ServiceExecution {
  return {
    id: 42,
    proposalId: 5,
    requestId: 10,
    scheduledDate: null,
    scheduledEndDate: null,
    checkinTime: null,
    checkinLatitude: null,
    checkinLongitude: null,
    checkoutTime: null,
    notes: null,
    materialsUsed: null,
    completedAt: null,
    createdAt: '2026-03-14T08:00:00Z',
    assignments: [],
    photos: [],
    ...overrides,
  };
}

interface RenderOptions {
  requestId?: number;
  requestStatus?: RequestStatus;
  isProvider?: boolean;
  targetLat?: number;
  targetLon?: number;
}

function renderPanel(opts: RenderOptions = {}) {
  const props = {
    requestId: opts.requestId ?? 10,
    requestStatus: opts.requestStatus ?? ('IN_PROGRESS' as RequestStatus),
    isProvider: opts.isProvider ?? true,
    targetLat: opts.targetLat ?? 38.65,
    targetLon: opts.targetLon ?? -27.22,
  };
  return render(<ExecutionPanel {...props} />);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ExecutionPanel (deeper)', () => {
  beforeEach(() => {
    mockMutationReturn = {
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    };
    mockQueryReturn = {
      data: makeExecution(),
      isLoading: false,
    };
    mockMutate.mockReset();
  });

  // ── Render-nothing guard ──────────────────────────────────────────────

  it('renders nothing for DRAFT status', () => {
    const { container } = renderPanel({ requestStatus: 'DRAFT' });
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for PUBLISHED status', () => {
    const { container } = renderPanel({ requestStatus: 'PUBLISHED' });
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for WITH_PROPOSALS status', () => {
    const { container } = renderPanel({ requestStatus: 'WITH_PROPOSALS' });
    expect(container.innerHTML).toBe('');
  });

  // ── Loading & empty states ────────────────────────────────────────────

  it('shows loading spinner while fetching', () => {
    mockQueryReturn = { data: null, isLoading: true };
    const { container } = renderPanel();
    // Loader2 renders as an svg with the animate-spin class
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });

  it('returns null when no execution data', () => {
    mockQueryReturn = { data: null, isLoading: false };
    const { container } = renderPanel();
    expect(container.innerHTML).toBe('');
  });

  // ── Progress steps ────────────────────────────────────────────────────

  it('shows progress steps (Equipa, Check-in, Fotos, Concluído)', () => {
    renderPanel();
    expect(screen.getAllByText('Equipa').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Check-in').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Fotos')).toBeInTheDocument();
    expect(screen.getAllByText('Concluído').length).toBeGreaterThanOrEqual(1);
  });

  // ── Assignments ───────────────────────────────────────────────────────

  it('shows assignments list with names and roles', () => {
    mockQueryReturn = {
      data: makeExecution({
        assignments: [
          makeAssignment({ teamMemberName: 'Carlos Ferreira', teamMemberRole: 'LEAD' }),
          makeAssignment({ id: 2, teamMemberId: 20, teamMemberName: 'Ana Costa', teamMemberRole: 'OPERATOR' }),
        ],
      }),
      isLoading: false,
    };
    renderPanel();
    expect(screen.getByText('Carlos Ferreira')).toBeInTheDocument();
    expect(screen.getByText('(LEAD)')).toBeInTheDocument();
    expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    expect(screen.getByText('(OPERATOR)')).toBeInTheDocument();
  });

  it('shows "Nenhum membro atribuído." when no assignments', () => {
    mockQueryReturn = {
      data: makeExecution({ assignments: [] }),
      isLoading: false,
    };
    renderPanel();
    expect(screen.getByText('Nenhum membro atribuído.')).toBeInTheDocument();
  });

  it('shows machine name in assignment', () => {
    mockQueryReturn = {
      data: makeExecution({
        assignments: [
          makeAssignment({ machineId: 5, machineName: 'Trator Kubota M7060' }),
        ],
      }),
      isLoading: false,
    };
    renderPanel();
    expect(screen.getByText('Trator Kubota M7060')).toBeInTheDocument();
  });

  // ── AssignmentForm visibility ─────────────────────────────────────────

  it('shows AssignmentForm when isProvider and AWARDED', () => {
    mockQueryReturn = {
      data: makeExecution(),
      isLoading: false,
    };
    renderPanel({ requestStatus: 'AWARDED', isProvider: true });
    expect(screen.getByTestId('assignment-form')).toBeInTheDocument();
  });

  // ── Check-in ──────────────────────────────────────────────────────────

  it('shows check-in info when checked in (date + coordinates)', () => {
    mockQueryReturn = {
      data: makeExecution({
        checkinTime: '2026-03-15T10:30:00Z',
        checkinLatitude: 38.6545,
        checkinLongitude: -27.2167,
      }),
      isLoading: false,
    };
    renderPanel();
    expect(screen.getByText(/Check-in realizado em/)).toBeInTheDocument();
    expect(screen.getByText('15/03/2026 10:30')).toBeInTheDocument();
    expect(screen.getByText(/38\.6545/)).toBeInTheDocument();
    expect(screen.getByText(/-27\.2167/)).toBeInTheDocument();
  });

  it('shows "Check-in ainda não realizado." for non-provider when not checked in', () => {
    mockQueryReturn = {
      data: makeExecution({ checkinTime: null }),
      isLoading: false,
    };
    renderPanel({ isProvider: false });
    expect(screen.getByText('Check-in ainda não realizado.')).toBeInTheDocument();
  });

  // ── Photos ────────────────────────────────────────────────────────────

  it('shows photo grid when photos exist', () => {
    mockQueryReturn = {
      data: makeExecution({
        photos: [
          makePhoto({ id: 1, photoUrl: 'https://cdn.example.com/a.jpg' }),
          makePhoto({ id: 2, photoUrl: 'https://cdn.example.com/b.jpg' }),
        ],
      }),
      isLoading: false,
    };
    renderPanel();
    const images = screen.getAllByAltText('Foto da execução');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://cdn.example.com/a.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://cdn.example.com/b.jpg');
  });

  it('shows "Nenhuma foto carregada." for client with no photos', () => {
    mockQueryReturn = {
      data: makeExecution({ photos: [] }),
      isLoading: false,
    };
    renderPanel({ isProvider: false });
    expect(screen.getByText('Nenhuma foto carregada.')).toBeInTheDocument();
  });

  // ── Complete form ─────────────────────────────────────────────────────

  it('shows complete form button for provider after check-in', () => {
    mockQueryReturn = {
      data: makeExecution({
        checkinTime: '2026-03-15T10:30:00Z',
        checkinLatitude: 38.6545,
        checkinLongitude: -27.2167,
        completedAt: null,
      }),
      isLoading: false,
    };
    renderPanel({ isProvider: true, requestStatus: 'IN_PROGRESS' });
    const completeBtn = screen.getByRole('button', { name: /Marcar como Concluído/i });
    expect(completeBtn).toBeInTheDocument();

    // Click to expand form
    fireEvent.click(completeBtn);
    expect(screen.getByLabelText(/Notas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Materiais utilizados/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar Conclusão/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
  });
});
