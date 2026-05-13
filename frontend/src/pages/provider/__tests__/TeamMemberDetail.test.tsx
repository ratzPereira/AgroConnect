import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import {
  getTeamMember,
  getOperatorAnalytics,
  listOperatorJobs,
  updateTeamMember,
  deactivateTeamMember,
} from '@/api/teamMembers';
import type { TeamMember, OperatorAnalytics, OperatorJob } from '@/types/teamMember';
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

vi.mock('@/api/teamMembers', () => ({
  getTeamMember: vi.fn(),
  getOperatorAnalytics: vi.fn(),
  listOperatorJobs: vi.fn(),
  updateTeamMember: vi.fn(),
  deactivateTeamMember: vi.fn(),
}));

const member: TeamMember = {
  id: 42,
  name: 'Carlos Silva',
  email: 'carlos@example.com',
  phone: '+351 912 345 678',
  role: 'OPERATOR',
  hourlyRate: 12.5,
  active: true,
  invitedAt: '2026-01-10T10:00:00Z',
  joinedAt: '2026-01-12T08:00:00Z',
};

const inactiveMember: TeamMember = { ...member, active: false };

const analytics: OperatorAnalytics = {
  operatorId: 42,
  operatorName: 'Carlos Silva',
  from: '2026-01-01',
  to: '2026-05-12',
  jobsDone: 12,
  hoursWorked: 96.5,
  laborCost: 1206.25,
  revenueAttributed: 3450,
  profit: 2243.75,
  profitPerHour: 23.25,
  profitPerJob: 186.98,
  topMachines: [
    { machineId: 1, machineName: 'Trator John Deere', jobsCount: 7, machineHours: 54 },
    { machineId: 2, machineName: 'Pulverizador Stihl', jobsCount: 3, machineHours: 18 },
  ],
};

const emptyAnalytics: OperatorAnalytics = {
  ...analytics,
  jobsDone: 0,
  hoursWorked: 0,
  laborCost: 0,
  revenueAttributed: 0,
  profit: 0,
  profitPerHour: 0,
  profitPerJob: 0,
  topMachines: [],
};

const jobsPage: Page<OperatorJob> = {
  content: [
    {
      executionId: 100,
      requestId: 9001,
      clientName: 'João Silva',
      hoursWorked: 4.5,
      hourlyRateSnapshot: 12.5,
      laborCost: 56.25,
      revenueAttributed: 250,
      machineName: 'Trator John Deere',
      completedAt: '2026-03-10T14:00:00Z',
    },
    {
      executionId: 101,
      requestId: null,
      clientName: null,
      hoursWorked: 2,
      hourlyRateSnapshot: 12.5,
      laborCost: 25,
      revenueAttributed: 100,
      machineName: null,
      completedAt: null,
    },
  ],
  totalElements: 2,
  totalPages: 1,
  number: 0,
  size: 10,
  first: true,
  last: true,
};

const emptyJobs: Page<OperatorJob> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 10,
  first: true,
  last: true,
};

async function renderPage() {
  const { TeamMemberDetail } = await import('../TeamMemberDetail');
  return renderWithProviders(<TeamMemberDetail />, { route: '/provider/team/42' });
}

describe('TeamMemberDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    (getTeamMember as Mock).mockResolvedValue(member);
    (getOperatorAnalytics as Mock).mockResolvedValue(analytics);
    (listOperatorJobs as Mock).mockResolvedValue(jobsPage);
  });

  it('renders member header with name, role badge, email/phone and hourly rate', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });

    expect(screen.getByText('Operador')).toBeInTheDocument();
    expect(screen.getByText(/carlos@example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/\+351 912 345 678/)).toBeInTheDocument();
    expect(screen.getByText('12.50 €/h')).toBeInTheDocument();
  });

  it('renders all 8 stat cards with values', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Trabalhos')).toBeInTheDocument();
    });

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('96.5 h')).toBeInTheDocument();
    expect(screen.getByText('Horas trabalhadas')).toBeInTheDocument();
    expect(screen.getByText('Custo mão-de-obra')).toBeInTheDocument();
    expect(screen.getByText('Receita atribuída')).toBeInTheDocument();
    expect(screen.getByText('preço / nº operadores')).toBeInTheDocument();
    expect(screen.getByText('Lucro')).toBeInTheDocument();
    expect(screen.getByText('Receita − mão-de-obra')).toBeInTheDocument();
    expect(screen.getByText('Lucro / hora')).toBeInTheDocument();
    expect(screen.getByText('Lucro / trabalho')).toBeInTheDocument();
    expect(screen.getByText('Máquinas usadas')).toBeInTheDocument();
    expect(screen.getByText('distintas no período')).toBeInTheDocument();
  });

  it('renders top machines card when topMachines is non-empty', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Máquinas mais usadas')).toBeInTheDocument();
    });

    // "Trator John Deere" appears in both top-machines card and jobs row
    expect(screen.getAllByText('Trator John Deere').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/7 trabalhos • 54 h/)).toBeInTheDocument();
    expect(screen.getByText('Pulverizador Stihl')).toBeInTheDocument();
    expect(screen.getByText(/3 trabalhos • 18 h/)).toBeInTheDocument();
  });

  it('does not render top machines card when topMachines is empty', async () => {
    (getOperatorAnalytics as Mock).mockResolvedValue(emptyAnalytics);
    (listOperatorJobs as Mock).mockResolvedValue(emptyJobs);
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });

    expect(screen.queryByText('Máquinas mais usadas')).not.toBeInTheDocument();
  });

  it('renders the jobs table with row data', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Trator John Deere').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('4.5 h')).toBeInTheDocument();
    expect(screen.getByText('2 h')).toBeInTheDocument();
  });

  it('clicking a job row with requestId navigates to its request detail', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    await user.click(screen.getByText('João Silva'));
    expect(navigateMock).toHaveBeenCalledWith('/requests/9001');
  });

  it('shows empty state when no jobs in period', async () => {
    (listOperatorJobs as Mock).mockResolvedValue(emptyJobs);
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Sem trabalhos no período.')).toBeInTheDocument();
    });
  });

  it('"Voltar à equipa" navigates back to list', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Voltar à equipa/i }));
    expect(navigateMock).toHaveBeenCalledWith('/provider/team');
  });

  it('opens edit modal and submits updateTeamMember with updated fields', async () => {
    (updateTeamMember as Mock).mockResolvedValue({ ...member, name: 'Carlos S. Renomeado' });
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Editar/i }));

    const dialog = await screen.findByRole('dialog');
    const name = dialog.querySelector('input[name="name"]') as HTMLInputElement;
    await user.clear(name);
    await user.type(name, 'Carlos S. Renomeado');

    const submit = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Guardar',
    ) as HTMLButtonElement;
    await user.click(submit);

    await waitFor(() => {
      expect(updateTeamMember).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          name: 'Carlos S. Renomeado',
          role: 'OPERATOR',
          hourlyRate: 12.5,
        }),
      );
    });
  });

  it('edit form clearing hourly rate forwards null', async () => {
    (updateTeamMember as Mock).mockResolvedValue(member);
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Editar/i }));

    const dialog = await screen.findByRole('dialog');
    const rate = dialog.querySelector('input[name="hourlyRate"]') as HTMLInputElement;
    await user.clear(rate);

    const submit = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Guardar',
    ) as HTMLButtonElement;
    await user.click(submit);

    await waitFor(() => {
      expect(updateTeamMember).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ hourlyRate: null }),
      );
    });
  });

  it('opens deactivate modal and calls deactivateTeamMember + navigates back on confirm', async () => {
    (deactivateTeamMember as Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Desativar/i }));

    const dialog = await screen.findByRole('dialog');
    const confirm = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Desativar',
    ) as HTMLButtonElement;
    await user.click(confirm);

    await waitFor(() => {
      expect(deactivateTeamMember).toHaveBeenCalledWith(42);
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/provider/team');
    });
  });

  it('hides "Desativar" button when member is inactive', async () => {
    (getTeamMember as Mock).mockResolvedValue(inactiveMember);
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Desativar/i })).not.toBeInTheDocument();
  });

  it('"Ano atual" resets the date range to start-of-year → today', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });

    const dateInputs = document.querySelectorAll('input[type="date"]');
    const fromInput = dateInputs[0] as HTMLInputElement;
    const toInput = dateInputs[1] as HTMLInputElement;

    await user.clear(fromInput);
    await user.type(fromInput, '2025-06-01');
    await user.clear(toInput);
    await user.type(toInput, '2025-12-31');

    await user.click(screen.getByRole('button', { name: 'Ano atual' }));

    const year = new Date().getFullYear();
    expect(fromInput.value).toBe(`${year}-01-01`);
    expect(toInput.value).toBe(new Date().toISOString().slice(0, 10));
  });
});
