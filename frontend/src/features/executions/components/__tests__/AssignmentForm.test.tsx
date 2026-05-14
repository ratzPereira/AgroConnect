import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssignmentForm } from '../AssignmentForm';

const mockMutate = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'team-members') {
      return { data: [{ id: 1, name: 'Jo\u00e3o Silva', role: 'OPERATOR', active: true }] };
    }
    if (queryKey[0] === 'machines') {
      return { data: [{ id: 1, name: 'Trator John Deere', status: 'AVAILABLE' }] };
    }
    return { data: null };
  }),
  useMutation: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

vi.mock('@/api/executions', () => ({
  assignExecution: vi.fn(),
}));

vi.mock('@/api/teamMembers', () => ({
  listTeamMembers: vi.fn(),
}));

vi.mock('@/api/machines', () => ({
  listMachines: vi.fn(),
}));

describe('AssignmentForm', () => {
  const defaultProps = { executionId: 1, requestId: 10 };

  it('renders team member and machine dropdowns', () => {
    render(<AssignmentForm {...defaultProps} />);
    expect(screen.getByLabelText(/membro da equipa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/m\u00e1quina/i)).toBeInTheDocument();
  });

  it('renders team member options from query data', () => {
    render(<AssignmentForm {...defaultProps} />);
    expect(screen.getByText('Jo\u00e3o Silva (Operador)')).toBeInTheDocument();
  });

  it('renders submit button disabled when no team member selected', () => {
    render(<AssignmentForm {...defaultProps} />);
    const submitBtn = screen.getByRole('button', { name: /atribuir/i });
    expect(submitBtn).toBeDisabled();
  });

  it('shows "Atribuir" button text', () => {
    render(<AssignmentForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /atribuir/i })).toBeInTheDocument();
  });
});
