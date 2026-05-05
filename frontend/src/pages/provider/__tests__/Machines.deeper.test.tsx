import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { listMachines, createMachine, updateMachine } from '@/api/machines';
import type { Machine } from '@/types/machine';

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
  updateMachine: vi.fn(),
  deleteMachine: vi.fn(),
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

  it('renders empty state with correct text when no machines exist', async () => {
    (listMachines as Mock).mockResolvedValue([]);

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Sem maquinas registadas')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Registe as suas maquinas para acompanhar a disponibilidade e manutencao.'),
    ).toBeInTheDocument();
  });

  it('renders machine cards with name, type, and status badge', async () => {
    (listMachines as Mock).mockResolvedValue(allMachines);

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    // Names
    expect(screen.getByText('Pulverizador Stihl')).toBeInTheDocument();
    expect(screen.getByText('Motocultivador antigo')).toBeInTheDocument();

    // Types (where available)
    expect(screen.getByText('Trator')).toBeInTheDocument();
    expect(screen.getByText('Pulverizador')).toBeInTheDocument();

    // Status badges
    expect(screen.getByText('Disponivel')).toBeInTheDocument();
    expect(screen.getByText('Em uso')).toBeInTheDocument();
    expect(screen.getByText('Retirada')).toBeInTheDocument();
  });

  it('shows description, licensePlate, and nextMaintenanceDate when available', async () => {
    (listMachines as Mock).mockResolvedValue(allMachines);

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    // Description
    expect(screen.getByText('Trator compacto para trabalho em terrenos pequenos')).toBeInTheDocument();
    expect(screen.getByText('Avariado, para abate')).toBeInTheDocument();

    // License plates
    expect(screen.getByText('Matricula: AA-12-BB')).toBeInTheDocument();
    expect(screen.getByText('Matricula: CC-34-DD')).toBeInTheDocument();

    // Next maintenance date
    expect(screen.getByText('Prox. manutencao: 2026-06-15')).toBeInTheDocument();
  });

  it('shows delete button only for RETIRED machines', async () => {
    (listMachines as Mock).mockResolvedValue(allMachines);

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    // Only 1 "Eliminar" button (for the retired machine)
    const deleteButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent?.includes('Eliminar'),
    );
    expect(deleteButtons).toHaveLength(1);

    // All machines have "Editar" button
    const editButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent?.includes('Editar'),
    );
    expect(editButtons).toHaveLength(3);
  });

  it('clicking "Adicionar" shows the create form', async () => {
    (listMachines as Mock).mockResolvedValue([]);
    const user = userEvent.setup();

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Sem maquinas registadas')).toBeInTheDocument();
    });

    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Adicionar') && !btn.textContent?.includes('maquina'),
    );
    expect(addButton).toBeDefined();
    await user.click(addButton!);

    expect(screen.getByPlaceholderText('Nome da maquina')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tipo (ex: Trator)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Matricula')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Descricao')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('submitting the create form calls createMachine', async () => {
    (listMachines as Mock).mockResolvedValue([]);
    (createMachine as Mock).mockResolvedValue({
      id: 10,
      name: 'Nova Ceifeira',
      type: 'Ceifeira',
      description: undefined,
      status: 'AVAILABLE',
      licensePlate: undefined,
      lastMaintenanceDate: null,
      nextMaintenanceDate: null,
      createdAt: '2026-03-29T10:00:00Z',
    });
    const user = userEvent.setup();

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Sem maquinas registadas')).toBeInTheDocument();
    });

    // Open form
    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Adicionar') && !btn.textContent?.includes('maquina'),
    );
    await user.click(addButton!);

    await user.type(screen.getByPlaceholderText('Nome da maquina'), 'Nova Ceifeira');
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

  it('clicking "Editar" on a card shows the inline edit form', async () => {
    (listMachines as Mock).mockResolvedValue([availableMachine]);
    const user = userEvent.setup();

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /Editar/i });
    await user.click(editButton);

    // Edit form should now be visible with pre-filled values
    const nameInput = screen.getByDisplayValue('Trator John Deere 5075');
    expect(nameInput).toBeInTheDocument();

    const typeInput = screen.getByDisplayValue('Trator');
    expect(typeInput).toBeInTheDocument();

    const plateInput = screen.getByDisplayValue('AA-12-BB');
    expect(plateInput).toBeInTheDocument();
  });

  it('submitting the edit form calls updateMachine and cancel hides it', async () => {
    (listMachines as Mock).mockResolvedValue([availableMachine]);
    (updateMachine as Mock).mockResolvedValue({ ...availableMachine, name: 'Trator Atualizado' });
    const user = userEvent.setup();

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    // Open edit
    await user.click(screen.getByRole('button', { name: /Editar/i }));

    // Clear name and type new value
    const nameInput = screen.getByDisplayValue('Trator John Deere 5075');
    await user.clear(nameInput);
    await user.type(nameInput, 'Trator Atualizado');

    // Submit
    await user.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(updateMachine).toHaveBeenCalledWith(1, expect.objectContaining({
        name: 'Trator Atualizado',
      }));
    });
  });

  it('clicking cancel on the edit form hides it and restores card view', async () => {
    (listMachines as Mock).mockResolvedValue([availableMachine]);
    const user = userEvent.setup();

    await renderMachinesPage();

    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });

    // Open edit
    await user.click(screen.getByRole('button', { name: /Editar/i }));
    expect(screen.getByDisplayValue('Trator John Deere 5075')).toBeInTheDocument();

    // Cancel edit
    await user.click(screen.getByText('Cancelar'));

    // Card view should be restored
    await waitFor(() => {
      expect(screen.getByText('Trator John Deere 5075')).toBeInTheDocument();
    });
    expect(screen.getByText('Disponivel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument();
  });
});
