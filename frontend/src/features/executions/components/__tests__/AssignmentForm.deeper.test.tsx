import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mock API modules ───────────────────────────────────────────────────────
vi.mock('@/api/executions', () => ({
  assignExecution: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  apiClient: { get: vi.fn() },
}));

// ── React Query mock variables (set per-test) ──────────────────────────────
const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();

interface TeamMember {
  id: number;
  name: string;
  role: string;
}

interface Machine {
  id: number;
  name: string;
}

let teamMembersData: TeamMember[] | undefined;
let machinesData: Machine[] | undefined;
let mutationIsPending: boolean;
let mutationIsError: boolean;
let _mutationOnSuccessFn: (() => void) | null;
let _mutationOnMutateFn: ((data: { teamMemberId: number; machineId?: number }) => void) | null;

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'team-members') {
      return { data: teamMembersData };
    }
    if (queryKey[0] === 'machines') {
      return { data: machinesData };
    }
    return { data: null };
  }),
  useMutation: vi.fn(({ onSuccess, mutationFn }: { onSuccess?: () => void; mutationFn?: (data: { teamMemberId: number; machineId?: number }) => Promise<unknown> }) => {
    _mutationOnSuccessFn = onSuccess ?? null;
    _mutationOnMutateFn = mutationFn ? ((data: { teamMemberId: number; machineId?: number }) => {
      mockMutate(data);
    }) : null;

    return {
      mutate: (data: { teamMemberId: number; machineId?: number }) => {
        mockMutate(data);
      },
      isPending: mutationIsPending,
      isError: mutationIsError,
    };
  }),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}));

import { AssignmentForm } from '../AssignmentForm';

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AssignmentForm (deeper)', () => {
  const defaultProps = { executionId: 42, requestId: 10 };

  beforeEach(() => {
    teamMembersData = [
      { id: 1, name: 'João Silva', role: 'Operador' },
      { id: 2, name: 'Ana Costa', role: 'Técnica' },
    ];
    machinesData = [
      { id: 10, name: 'Trator John Deere 5075' },
      { id: 20, name: 'Pulverizador Stihl' },
    ];
    mutationIsPending = false;
    mutationIsError = false;
    _mutationOnSuccessFn = null;
    _mutationOnMutateFn = null;
    mockMutate.mockReset();
    mockInvalidateQueries.mockReset();
  });

  it('renders team member and machine selects', () => {
    render(<AssignmentForm {...defaultProps} />);
    expect(screen.getByLabelText(/Membro da equipa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Máquina/i)).toBeInTheDocument();
  });

  it('renders team member options from query data', () => {
    render(<AssignmentForm {...defaultProps} />);
    expect(screen.getByText('João Silva (Operador)')).toBeInTheDocument();
    expect(screen.getByText('Ana Costa (Técnica)')).toBeInTheDocument();
  });

  it('renders machine options from query data', () => {
    render(<AssignmentForm {...defaultProps} />);
    expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    expect(screen.getByText('Pulverizador Stihl')).toBeInTheDocument();
  });

  it('submit button disabled when no team member selected', () => {
    render(<AssignmentForm {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /Atribuir/i });
    expect(btn).toBeDisabled();
  });

  it('submit button enabled when team member selected', () => {
    render(<AssignmentForm {...defaultProps} />);
    const select = screen.getByLabelText(/Membro da equipa/i);
    fireEvent.change(select, { target: { value: '1' } });
    const btn = screen.getByRole('button', { name: /Atribuir/i });
    expect(btn).not.toBeDisabled();
  });

  it('calls assignExecution with correct data on submit (team member only)', () => {
    render(<AssignmentForm {...defaultProps} />);

    const teamSelect = screen.getByLabelText(/Membro da equipa/i);
    fireEvent.change(teamSelect, { target: { value: '1' } });

    const form = screen.getByRole('button', { name: /Atribuir/i }).closest('form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(mockMutate).toHaveBeenCalledWith({
      teamMemberId: 1,
      machineId: undefined,
    });
  });

  it('calls assignExecution with machineId when machine selected', () => {
    render(<AssignmentForm {...defaultProps} />);

    const teamSelect = screen.getByLabelText(/Membro da equipa/i);
    fireEvent.change(teamSelect, { target: { value: '2' } });

    const machineSelect = screen.getByLabelText(/Máquina/i);
    fireEvent.change(machineSelect, { target: { value: '10' } });

    const form = screen.getByRole('button', { name: /Atribuir/i }).closest('form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(mockMutate).toHaveBeenCalledWith({
      teamMemberId: 2,
      machineId: 10,
    });
  });

  it('shows error message on mutation failure', () => {
    mutationIsError = true;
    render(<AssignmentForm {...defaultProps} />);
    expect(screen.getByText('Erro ao atribuir membro. Tente novamente.')).toBeInTheDocument();
  });

  it('shows loading state on button during mutation', () => {
    mutationIsPending = true;
    render(<AssignmentForm {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /Atribuir/i });
    // When loading=true, the Button component renders disabled and shows Loader2 spinner
    expect(btn).toBeDisabled();
  });

  it('does not call mutate when form submitted without team member', () => {
    render(<AssignmentForm {...defaultProps} />);

    const form = screen.getByRole('button', { name: /Atribuir/i }).closest('form') as HTMLFormElement;
    fireEvent.submit(form);

    // handleSubmit returns early if !teamMemberId
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
