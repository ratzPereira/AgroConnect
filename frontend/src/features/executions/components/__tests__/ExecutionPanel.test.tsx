import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ExecutionPanel } from '../ExecutionPanel';

const mockExecution = {
  id: 1,
  requestId: 10,
  checkinTime: null as string | null,
  checkinLatitude: null as number | null,
  checkinLongitude: null as number | null,
  completedAt: null as string | null,
  notes: null as string | null,
  materialsUsed: null as string | null,
  assignments: [
    { id: 1, teamMemberName: 'João Silva', teamMemberRole: 'OPERATOR', machineName: 'Trator Kubota' },
  ],
  photos: [] as { id: number; photoUrl: string }[],
};

let mockQueryReturn = {
  data: mockExecution,
  isLoading: false,
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => mockQueryReturn),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

vi.mock('@/api/executions', () => ({
  getExecutionByRequest: vi.fn(),
  completeExecution: vi.fn(),
}));

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

vi.mock('date-fns', () => ({
  format: vi.fn(() => '15/03/2026 14:30'),
}));

describe('ExecutionPanel', () => {
  function renderPanel(props = {}) {
    const defaultProps = {
      requestId: 10,
      requestStatus: 'IN_PROGRESS' as const,
      isProvider: true,
      targetLat: 38.65,
      targetLon: -27.22,
    };
    return render(
      <MemoryRouter>
        <ExecutionPanel {...defaultProps} {...props} />
      </MemoryRouter>,
    );
  }

  it('renders nothing for non-execution-eligible statuses', () => {
    const { container } = renderPanel({ requestStatus: 'PUBLISHED' });
    expect(container.innerHTML).toBe('');
  });

  it('renders execution details section with header', () => {
    renderPanel();
    expect(screen.getByText('Execução do Serviço')).toBeInTheDocument();
  });

  it('renders team assignments', () => {
    renderPanel();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('(OPERATOR)')).toBeInTheDocument();
    expect(screen.getByText('Trator Kubota')).toBeInTheDocument();
  });

  it('shows checkin info when checked in', () => {
    mockQueryReturn = {
      data: {
        ...mockExecution,
        checkinTime: '2026-03-15T14:30:00Z',
        checkinLatitude: 38.6545,
        checkinLongitude: -27.2167,
      },
      isLoading: false,
    };
    renderPanel();
    expect(screen.getByText(/Check-in realizado em/)).toBeInTheDocument();
  });

  it('shows photo section heading', () => {
    mockQueryReturn = { data: mockExecution, isLoading: false };
    renderPanel();
    expect(screen.getByText('Fotos da Execução')).toBeInTheDocument();
  });

  it('shows step indicators', () => {
    mockQueryReturn = { data: mockExecution, isLoading: false };
    renderPanel();
    // "Equipa" appears both in step indicator and section heading
    expect(screen.getAllByText('Equipa').length).toBeGreaterThanOrEqual(1);
    // "Check-in" appears both in step indicator and section heading
    expect(screen.getAllByText('Check-in').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Fotos')).toBeInTheDocument();
    // "Concluído" may appear in step indicator
    expect(screen.getAllByText('Concluído').length).toBeGreaterThanOrEqual(1);
  });
});
