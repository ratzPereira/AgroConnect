import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { listMachines, createMachine } from '@/api/machines';
import type { Machine } from '@/types/machine';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { variants: _v, initial: _i, animate: _a, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
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

vi.mock('@/components/illustrations/EmptyRequests', () => ({
  EmptyRequests: (props: Record<string, unknown>) => (
    <div data-testid="empty-requests-illustration" {...props} />
  ),
}));

vi.mock('@/api/machines', () => ({
  listMachines: vi.fn(),
  createMachine: vi.fn(),
}));

const availableMachine: Machine = {
  id: 1,
  name: 'Trator John Deere 5075',
  type: 'Trator',
  description: 'Trator compacto para trabalho em terrenos pequenos',
  status: 'AVAILABLE',
  licensePlate: 'AA-12-BB',
  lastMaintenanceDate: '2026-02-15',
  nextMaintenanceDate: '2026-06-15',
  createdAt: '2025-06-01T10:00:00Z',
};

const inUseMachine: Machine = {
  id: 2,
  name: 'Pulverizador Stihl',
  type: 'Pulverizador',
  description: null,
  status: 'IN_USE',
  licensePlate: null,
  lastMaintenanceDate: null,
  nextMaintenanceDate: null,
  createdAt: '2025-08-01T10:00:00Z',
};

const retiredMachine: Machine = {
  id: 3,
  name: 'Motocultivador antigo',
  type: null,
  description: 'Avariado, para abate',
  status: 'RETIRED',
  licensePlate: 'CC-34-DD',
  lastMaintenanceDate: null,
  nextMaintenanceDate: null,
  createdAt: '2024-01-01T10:00:00Z',
};

const allMachines = [availableMachine, inUseMachine, retiredMachine];

async function renderMachinesPage() {
  const { Machines } = await import('../Machines');
  return renderWithProviders(<Machines />, { route: '/provider/machines' });
}

describe('Machines Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  it('renders loading skeletons while data is being fetched', async () => {
    let resolveList: (value: Machine[]) => void;
    (listMachines as Mock).mockReturnValue(
      new Promise<Machine[]>((resolve) => { resolveList = resolve; }),
    );

    await renderMachinesPage();

    const skeletonCards = document.querySelectorAll('.rounded-xl.border');
    expect(skeletonCards.length).toBeGreaterThanOrEqual(3);

    resolveList!(allMachines);
    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });
  });

  it('renders empty state when no machines exist', async () => {
    (listMachines as Mock).mockResolvedValue([]);

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Sem máquinas registadas')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Registe as suas máquinas para acompanhar a disponibilidade e manutenção.'),
    ).toBeInTheDocument();
  });

  it('renders machine cards with name, type, and status badge', async () => {
    (listMachines as Mock).mockResolvedValue(allMachines);

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    expect(screen.getByText('Pulverizador Stihl')).toBeInTheDocument();
    expect(screen.getByText('Motocultivador antigo')).toBeInTheDocument();

    expect(screen.getByText('Trator')).toBeInTheDocument();
    expect(screen.getByText('Pulverizador')).toBeInTheDocument();

    expect(screen.getByText('Disponível')).toBeInTheDocument();
    expect(screen.getByText('Em uso')).toBeInTheDocument();
    expect(screen.getByText('Retirada')).toBeInTheDocument();
  });

  it('shows description, licensePlate, and nextMaintenanceDate when available', async () => {
    (listMachines as Mock).mockResolvedValue(allMachines);

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    expect(screen.getByText('Trator compacto para trabalho em terrenos pequenos')).toBeInTheDocument();
    expect(screen.getByText('Avariado, para abate')).toBeInTheDocument();
    expect(screen.getByText('Matrícula: AA-12-BB')).toBeInTheDocument();
    expect(screen.getByText('Matrícula: CC-34-DD')).toBeInTheDocument();
    expect(screen.getByText('Próx. manutenção: 2026-06-15')).toBeInTheDocument();
  });

  it('clicking a machine card navigates to its detail page', async () => {
    (listMachines as Mock).mockResolvedValue([availableMachine]);
    const user = userEvent.setup();

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    const card = screen.getByText('Trator John Deere 5075').closest('button, [role="button"]')
      ?? screen.getByText('Trator John Deere 5075').closest('div[class*="cursor-pointer"]');
    expect(card).toBeTruthy();
    await user.click(card as Element);

    expect(navigateMock).toHaveBeenCalledWith('/provider/machines/1');
  });

  it('clicking "Adicionar" shows the create form', async () => {
    (listMachines as Mock).mockResolvedValue([]);
    const user = userEvent.setup();

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Sem máquinas registadas')).toBeInTheDocument();
    });

    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Adicionar') && !btn.textContent?.includes('maquina'),
    );
    expect(addButton).toBeDefined();
    await user.click(addButton!);

    expect(screen.getByPlaceholderText('Nome da máquina')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tipo (ex: Trator)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Matrícula')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Descrição')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('submitting the create form calls createMachine', async () => {
    (listMachines as Mock).mockResolvedValue([]);
    (createMachine as Mock).mockResolvedValue({
      id: 10,
      name: 'Nova Ceifeira',
      type: 'Ceifeira',
      description: null,
      status: 'AVAILABLE',
      licensePlate: null,
      lastMaintenanceDate: null,
      nextMaintenanceDate: null,
      createdAt: '2026-03-29T10:00:00Z',
    });
    const user = userEvent.setup();

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Sem máquinas registadas')).toBeInTheDocument();
    });

    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Adicionar') && !btn.textContent?.includes('maquina'),
    );
    await user.click(addButton!);

    await user.type(screen.getByPlaceholderText('Nome da máquina'), 'Nova Ceifeira');
    await user.type(screen.getByPlaceholderText('Tipo (ex: Trator)'), 'Ceifeira');

    await user.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(createMachine).toHaveBeenCalledWith({
        name: 'Nova Ceifeira',
        type: 'Ceifeira',
        description: undefined,
        licensePlate: undefined,
      });
    });
  });
});
