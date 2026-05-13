import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { JobCosts } from '@/types/jobCosting';

const mockDeleteResourceUsage = vi.fn();
const mockMutate = vi.fn();

let mockQueryReturn: { data: JobCosts | undefined; isLoading: boolean; error: unknown };
let mockMutationReturn: { mutate: typeof mockMutate; isPending: boolean };

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => mockQueryReturn),
  useMutation: vi.fn(() => mockMutationReturn),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

vi.mock('@/api/jobCosting', () => ({
  getJobCosts: vi.fn(),
  deleteResourceUsage: (...args: unknown[]) => mockDeleteResourceUsage(...args),
  updateAssignmentHours: vi.fn(),
}));

vi.mock('../ResourceUsageModal', () => ({
  ResourceUsageModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="resource-usage-modal" /> : null,
}));

import { JobCostingPanel } from '../JobCostingPanel';

function makeCosts(overrides: Partial<JobCosts> = {}): JobCosts {
  return {
    executionId: 1,
    completed: false,
    revenue: 500,
    materialsCost: 25,
    laborCost: 80,
    commission: 60,
    commissionRate: 0.12,
    netProfit: 335,
    marginPercent: 67,
    assignments: [
      {
        assignmentId: 11,
        teamMemberId: 22,
        teamMemberName: 'Carlos Mendes',
        hoursWorked: 8,
        machineHours: 6.5,
        effectiveHourlyRate: 10,
        laborCost: 80,
      },
    ],
    resourceUsages: [
      {
        id: 33,
        inventoryItemId: 44,
        productName: 'Adubo NPK',
        unit: 'KG',
        quantity: 12.5,
        unitCostSnapshot: 2,
        totalCost: 25,
        notes: 'Aplicado no talhão A',
        inventoryMovementId: 99,
        recordedById: 22,
        recordedByName: 'Carlos Mendes',
        createdAt: '2026-05-12T10:00:00Z',
      },
    ],
    assignmentsMissingRate: 0,
    ...overrides,
  };
}

describe('JobCostingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationReturn = { mutate: mockMutate, isPending: false };
    mockQueryReturn = { data: makeCosts(), isLoading: false, error: null };
  });

  it('renders nothing for non-provider users', () => {
    const { container } = render(
      <JobCostingPanel executionId={1} requestId={10} isProvider={false} canEdit={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders financial summary with revenue, materials, labor and net profit', () => {
    render(
      <JobCostingPanel executionId={1} requestId={10} isProvider={true} canEdit={true} />,
    );
    expect(screen.getByText('Custos & Rentabilidade')).toBeInTheDocument();
    expect(screen.getByText('Lucro líquido')).toBeInTheDocument();
    expect(screen.getAllByText(/500,00/).length).toBeGreaterThan(0); // revenue
    expect(screen.getAllByText(/335,00/).length).toBeGreaterThan(0); // net profit
    expect(screen.getByText(/margem 67\.0%/)).toBeInTheDocument();
  });

  it('renders resource usage row with product name and cost', () => {
    render(
      <JobCostingPanel executionId={1} requestId={10} isProvider={true} canEdit={true} />,
    );
    expect(screen.getByText('Adubo NPK')).toBeInTheDocument();
    expect(screen.getByText(/Aplicado no talhão A/)).toBeInTheDocument();
  });

  it('renders assignment row with hours and hourly rate', () => {
    render(
      <JobCostingPanel executionId={1} requestId={10} isProvider={true} canEdit={true} />,
    );
    expect(screen.getByText('Carlos Mendes')).toBeInTheDocument();
    expect(screen.getByText(/8h trabalhadas/)).toBeInTheDocument();
    expect(screen.getByText(/10\.00 €\/h/)).toBeInTheDocument();
  });

  it('shows assignmentsMissingRate warning when applicable', () => {
    mockQueryReturn = {
      data: makeCosts({ assignmentsMissingRate: 2 }),
      isLoading: false,
      error: null,
    };
    render(
      <JobCostingPanel executionId={1} requestId={10} isProvider={true} canEdit={true} />,
    );
    expect(screen.getByText(/2 membros sem taxa horária/)).toBeInTheDocument();
  });

  it('shows locked badge when execution is completed', () => {
    mockQueryReturn = {
      data: makeCosts({ completed: true }),
      isLoading: false,
      error: null,
    };
    render(
      <JobCostingPanel executionId={1} requestId={10} isProvider={true} canEdit={true} />,
    );
    expect(screen.getByText(/Bloqueado/)).toBeInTheDocument();
  });

  it('opens the resource usage modal when Adicionar is clicked', () => {
    render(
      <JobCostingPanel executionId={1} requestId={10} isProvider={true} canEdit={true} />,
    );
    const addButton = screen.getByRole('button', { name: /Adicionar/i });
    fireEvent.click(addButton);
    expect(screen.getByTestId('resource-usage-modal')).toBeInTheDocument();
  });

  it('hides edit controls when canEdit is false', () => {
    render(
      <JobCostingPanel executionId={1} requestId={10} isProvider={true} canEdit={false} />,
    );
    expect(screen.queryByRole('button', { name: /Adicionar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument();
  });
});
