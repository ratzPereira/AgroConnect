import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import {
  getMachine,
  getMachineAnalytics,
  listMachineJobs,
  listMaintenance,
  createMaintenance,
  deleteMaintenance,
  listMachineExpenses,
  createMachineExpense,
  deleteMachineExpense,
  updateMachine,
  deleteMachine,
} from '@/api/machines';
import type {
  Machine,
  MachineAnalytics,
  MaintenanceLog,
  MachineExpense,
} from '@/types/machine';
import type { Page } from '@/types/request';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: '42' }),
  };
});

vi.mock('@/components/AnimatedPage', () => ({
  AnimatedPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { layoutId: _l, transition: _t, animate: _a, initial: _i, exit: _e, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

vi.mock('recharts', async () => {
  const React = await import('react');
  return {
    BarChart: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'bar-chart' }, children),
    Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  };
});

vi.mock('@/api/machines', () => ({
  getMachine: vi.fn(),
  getMachineAnalytics: vi.fn(),
  listMachineJobs: vi.fn(),
  listMaintenance: vi.fn(),
  createMaintenance: vi.fn(),
  deleteMaintenance: vi.fn(),
  listMachineExpenses: vi.fn(),
  createMachineExpense: vi.fn(),
  deleteMachineExpense: vi.fn(),
  updateMachine: vi.fn(),
  deleteMachine: vi.fn(),
}));

const machine: Machine = {
  id: 42,
  name: 'Trator John Deere 5075',
  type: 'Trator',
  description: 'Trator agrícola',
  status: 'AVAILABLE',
  licensePlate: 'AA-12-BB',
  lastMaintenanceDate: '2026-02-15',
  nextMaintenanceDate: '2026-06-15',
  createdAt: '2025-06-01T10:00:00Z',
};

const retiredMachine: Machine = { ...machine, status: 'RETIRED' };

const analytics: MachineAnalytics = {
  machineId: 42,
  machineName: 'Trator John Deere 5075',
  from: '2026-01-01',
  to: '2026-05-12',
  jobsDone: 5,
  machineHours: 40,
  utilizationPercent: 12.5,
  revenue: 2500,
  maintenanceCost: 300,
  expensesCost: 150.5,
  netContribution: 2049.5,
  maintenanceCount: 2,
  lastMaintenanceAt: '2026-02-15',
  nextMaintenanceAt: '2026-06-15',
};

const emptyJobs: Page<unknown> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 10,
  first: true,
  last: true,
};

const jobsPage: Page<{
  executionId: number;
  requestId: number | null;
  clientName: string | null;
  revenue: number;
  machineHours: number;
  completedAt: string | null;
}> = {
  content: [
    {
      executionId: 100,
      requestId: 9001,
      clientName: 'João Silva',
      revenue: 500,
      machineHours: 4.5,
      completedAt: '2026-03-10T14:00:00Z',
    },
    {
      executionId: 101,
      requestId: null,
      clientName: null,
      revenue: 200,
      machineHours: 2,
      completedAt: '2026-04-05T09:30:00Z',
    },
  ],
  totalElements: 2,
  totalPages: 1,
  number: 0,
  size: 10,
  first: true,
  last: true,
};

const maintenanceList: MaintenanceLog[] = [
  {
    id: 500,
    machineId: 42,
    maintenanceType: 'ROUTINE',
    description: 'Mudança de óleo',
    cost: 120,
    workshopName: 'Oficina Central',
    performedAt: '2026-02-15',
    nextDueAt: '2026-08-15',
    notes: 'Filtros novos também',
    createdById: 7,
    createdByName: 'Provider Manager',
    createdAt: '2026-02-15T10:00:00Z',
  },
];

const expensesList: MachineExpense[] = [
  {
    id: 700,
    machineId: 42,
    category: 'FUEL',
    description: 'Gasóleo agrícola',
    amount: 75.5,
    incurredAt: '2026-04-01',
    notes: 'Repsol',
    createdById: 7,
    createdByName: 'Provider Manager',
    createdAt: '2026-04-01T10:00:00Z',
  },
];

async function renderPage() {
  const { MachineDetail } = await import('../MachineDetail');
  return renderWithProviders(<MachineDetail />, { route: '/provider/machines/42' });
}

describe('MachineDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    (getMachine as Mock).mockResolvedValue(machine);
    (getMachineAnalytics as Mock).mockResolvedValue(analytics);
    (listMachineJobs as Mock).mockResolvedValue(jobsPage);
    (listMaintenance as Mock).mockResolvedValue(maintenanceList);
    (listMachineExpenses as Mock).mockResolvedValue(expensesList);
  });

  it('renders machine header with name, status badge and type/plate', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    expect(screen.getByText('Disponível')).toBeInTheDocument();
    expect(screen.getByText(/AA-12-BB/)).toBeInTheDocument();
  });

  it('renders all 8 stat cards with values', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Horas máquina')).toBeInTheDocument();
    });

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('40 h')).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
    expect(screen.getByText('Contribuição líquida')).toBeInTheDocument();
    expect(screen.getByText('Receita − Manutenção − Despesas')).toBeInTheDocument();
    expect(screen.getByText('Próx. manutenção')).toBeInTheDocument();
  });

  it('shows hint text on utilization card', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('hrs / (dias × 8h)')).toBeInTheDocument();
    });
  });

  it('shows maintenance log entry under maintenance tab', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Manutenções' }));

    await waitFor(() => {
      expect(screen.getByText('Mudança de óleo')).toBeInTheDocument();
    });
    expect(screen.getByText('Rotina')).toBeInTheDocument();
    expect(screen.getByText(/Oficina Central/)).toBeInTheDocument();
  });

  it('shows expense entry under expenses tab', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Despesas' }));

    await waitFor(() => {
      expect(screen.getByText('Gasóleo agrícola')).toBeInTheDocument();
    });
    expect(screen.getByText('Combustível')).toBeInTheDocument();
  });

  it('shows jobs table under jobs tab', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Trabalhos' }));

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });
  });

  it('shows empty-state when no maintenance logs exist', async () => {
    (listMaintenance as Mock).mockResolvedValue([]);
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Manutenções' }));

    await waitFor(() => {
      expect(screen.getByText('Sem manutenções registadas.')).toBeInTheDocument();
    });
  });

  it('opens new maintenance modal and submits createMaintenance', async () => {
    (createMaintenance as Mock).mockResolvedValue({ id: 999 });
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Manutenções' }));
    await user.click(screen.getByRole('button', { name: /Adicionar manutenção/i }));

    const dialog = await screen.findByRole('dialog');
    const desc = dialog.querySelector('input[name="description"]') as HTMLInputElement;
    const cost = dialog.querySelector('input[name="cost"]') as HTMLInputElement;
    await user.type(desc, 'Inspeção anual');
    await user.type(cost, '85');

    const submit = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Registar',
    ) as HTMLButtonElement;
    await user.click(submit);

    await waitFor(() => {
      expect(createMaintenance).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          maintenanceType: 'ROUTINE',
          description: 'Inspeção anual',
          cost: 85,
        }),
      );
    });
  });

  it('opens new expense modal and submits createMachineExpense', async () => {
    (createMachineExpense as Mock).mockResolvedValue({ id: 800 });
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Despesas' }));
    await user.click(screen.getByRole('button', { name: /Adicionar despesa/i }));

    const dialog = await screen.findByRole('dialog');
    const amount = dialog.querySelector('input[name="amount"]') as HTMLInputElement;
    await user.type(amount, '42.5');

    const submit = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Registar',
    ) as HTMLButtonElement;
    await user.click(submit);

    await waitFor(() => {
      expect(createMachineExpense).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          category: 'FUEL',
          amount: 42.5,
        }),
      );
    });
  });

  it('deletes a maintenance log via the row delete button', async () => {
    (deleteMaintenance as Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Manutenções' }));

    await waitFor(() => {
      expect(screen.getByText('Mudança de óleo')).toBeInTheDocument();
    });

    // Find the row's trash button by walking up from the description
    const row = screen.getByText('Mudança de óleo').closest('div');
    const trashBtn = row?.parentElement?.parentElement?.querySelector('button') as HTMLButtonElement;
    await user.click(trashBtn);

    await waitFor(() => {
      expect(deleteMaintenance).toHaveBeenCalledWith(42, 500);
    });
  });

  it('deletes an expense via the row delete button', async () => {
    (deleteMachineExpense as Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Despesas' }));

    await waitFor(() => {
      expect(screen.getByText('Gasóleo agrícola')).toBeInTheDocument();
    });

    const row = screen.getByText('Gasóleo agrícola').closest('div');
    const trashBtn = row?.parentElement?.parentElement?.querySelector('button') as HTMLButtonElement;
    await user.click(trashBtn);

    await waitFor(() => {
      expect(deleteMachineExpense).toHaveBeenCalledWith(42, 700);
    });
  });

  it('opens edit modal and submits updateMachine', async () => {
    (updateMachine as Mock).mockResolvedValue({ ...machine, name: 'Trator Renomeado' });
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Editar/i }));

    const dialog = await screen.findByRole('dialog');
    const name = dialog.querySelector('input[name="name"]') as HTMLInputElement;
    await user.clear(name);
    await user.type(name, 'Trator Renomeado');

    const submit = dialog.querySelector('button[type="submit"]') as HTMLButtonElement;
    await user.click(submit);

    await waitFor(() => {
      expect(updateMachine).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ name: 'Trator Renomeado' }),
      );
    });
  });

  it('shows delete button only when machine is RETIRED', async () => {
    (getMachine as Mock).mockResolvedValue(retiredMachine);
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Eliminar/i })).toBeInTheDocument();
  });

  it('hides delete button when machine is not RETIRED', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Eliminar/i })).not.toBeInTheDocument();
  });

  it('confirm delete calls deleteMachine and navigates to list', async () => {
    (getMachine as Mock).mockResolvedValue(retiredMachine);
    (deleteMachine as Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Eliminar/i }));

    const dialog = await screen.findByRole('dialog');
    const confirm = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Eliminar',
    ) as HTMLButtonElement;
    await user.click(confirm);

    await waitFor(() => {
      expect(deleteMachine).toHaveBeenCalledWith(42);
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/provider/machines');
    });
  });

  it('"Voltar às máquinas" navigates back to list', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Voltar às máquinas/i }));

    expect(navigateMock).toHaveBeenCalledWith('/provider/machines');
  });

  it('shows empty state when there are no jobs in the period', async () => {
    (listMachineJobs as Mock).mockResolvedValue(emptyJobs);
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Trabalhos' }));

    await waitFor(() => {
      expect(screen.getByText('Sem trabalhos no período.')).toBeInTheDocument();
    });
  });
});
