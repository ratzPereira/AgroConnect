import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { listTeamMembers, createTeamMember, deactivateTeamMember } from '@/api/teamMembers';
import type { TeamMember } from '@/types/teamMember';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { variants, initial, animate, ...rest } = props;
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

vi.mock('@/components/illustrations/EmptyTeam', () => ({
  EmptyTeam: (props: Record<string, unknown>) => <div data-testid="empty-team-illustration" {...props} />,
}));

vi.mock('@/api/teamMembers', () => ({
  listTeamMembers: vi.fn(),
  createTeamMember: vi.fn(),
  deactivateTeamMember: vi.fn(),
}));

const mockMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Carlos Silva',
    email: 'carlos@example.com',
    phone: '+351 912 345 678',
    role: 'MANAGER',
    active: true,
    invitedAt: '2026-01-10T10:00:00Z',
    joinedAt: '2026-01-12T08:00:00Z',
  },
  {
    id: 2,
    name: 'Ana Costa',
    email: 'ana@example.com',
    phone: null,
    role: 'LEAD',
    active: true,
    invitedAt: '2026-02-01T10:00:00Z',
    joinedAt: '2026-02-03T08:00:00Z',
  },
  {
    id: 3,
    name: 'Pedro Santos',
    email: 'pedro@example.com',
    phone: '+351 923 456 789',
    role: 'OPERATOR',
    active: true,
    invitedAt: '2026-03-01T10:00:00Z',
    joinedAt: null,
  },
];

async function renderTeamPage() {
  const { Team } = await import('../Team');
  return renderWithProviders(<Team />, { route: '/provider/team' });
}

describe('Team Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons while data is being fetched', async () => {
    let resolveList: (value: TeamMember[]) => void;
    (listTeamMembers as Mock).mockReturnValue(
      new Promise<TeamMember[]>((resolve) => { resolveList = resolve; }),
    );

    await renderTeamPage();

    const skeletonCards = document.querySelectorAll('.rounded-xl.border');
    expect(skeletonCards.length).toBeGreaterThanOrEqual(3);

    resolveList!(mockMembers);
    await waitFor(() => {
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });
  });

  it('renders empty state with correct text when no members exist', async () => {
    (listTeamMembers as Mock).mockResolvedValue([]);

    await renderTeamPage();

    await waitFor(() => {
      expect(screen.getByText('A sua equipa está vazia')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Adicione membros à sua equipa para gerir os seus serviços de forma mais eficiente.'),
    ).toBeInTheDocument();
  });

  it('renders member cards with name, email, and role badges', async () => {
    (listTeamMembers as Mock).mockResolvedValue(mockMembers);

    await renderTeamPage();

    await waitFor(() => {
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });
    expect(screen.getByText('carlos@example.com')).toBeInTheDocument();
    expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('Pedro Santos')).toBeInTheDocument();
    expect(screen.getByText('pedro@example.com')).toBeInTheDocument();
  });

  it('shows phone number when available on member card', async () => {
    (listTeamMembers as Mock).mockResolvedValue(mockMembers);

    await renderTeamPage();

    await waitFor(() => {
      expect(screen.getByText('+351 912 345 678')).toBeInTheDocument();
    });
    expect(screen.getByText('+351 923 456 789')).toBeInTheDocument();
    // Ana has no phone, verify her email exists but no extra phone text
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  });

  it('displays correct role labels: Gestor, Chefe, Operador', async () => {
    (listTeamMembers as Mock).mockResolvedValue(mockMembers);

    await renderTeamPage();

    await waitFor(() => {
      expect(screen.getByText('Gestor')).toBeInTheDocument();
    });
    expect(screen.getByText('Chefe')).toBeInTheDocument();
    expect(screen.getByText('Operador')).toBeInTheDocument();
  });

  it('clicking "Adicionar" button shows the inline form', async () => {
    (listTeamMembers as Mock).mockResolvedValue([]);
    const user = userEvent.setup();

    await renderTeamPage();

    await waitFor(() => {
      expect(screen.getByText('A sua equipa está vazia')).toBeInTheDocument();
    });

    // The header "Adicionar" button
    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Adicionar') && !btn.textContent?.includes('membro'),
    );
    expect(addButton).toBeDefined();
    await user.click(addButton!);

    // Form should now be visible with placeholders
    expect(screen.getByPlaceholderText('Nome')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Telefone')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('submitting the form calls createTeamMember with entered data', async () => {
    (listTeamMembers as Mock).mockResolvedValue([]);
    (createTeamMember as Mock).mockResolvedValue({
      id: 4,
      name: 'Maria Ferreira',
      email: 'maria@example.com',
      phone: null,
      role: 'OPERATOR',
      active: true,
      invitedAt: '2026-03-29T10:00:00Z',
      joinedAt: null,
    });
    const user = userEvent.setup();

    await renderTeamPage();

    await waitFor(() => {
      expect(screen.getByText('A sua equipa está vazia')).toBeInTheDocument();
    });

    // Open form via header button
    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Adicionar') && !btn.textContent?.includes('membro'),
    );
    await user.click(addButton!);

    // Fill form
    await user.type(screen.getByPlaceholderText('Nome'), 'Maria Ferreira');
    await user.type(screen.getByPlaceholderText('Email'), 'maria@example.com');

    // Submit
    await user.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(createTeamMember).toHaveBeenCalledWith({
        name: 'Maria Ferreira',
        email: 'maria@example.com',
        phone: undefined,
        role: 'OPERATOR',
      });
    });
  });

  it('clicking "Cancelar" hides the inline form', async () => {
    (listTeamMembers as Mock).mockResolvedValue(mockMembers);
    const user = userEvent.setup();

    await renderTeamPage();

    await waitFor(() => {
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });

    // Open form
    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Adicionar'),
    );
    await user.click(addButton!);
    expect(screen.getByPlaceholderText('Nome')).toBeInTheDocument();

    // Cancel
    await user.click(screen.getByText('Cancelar'));
    expect(screen.queryByPlaceholderText('Nome')).not.toBeInTheDocument();
  });

  it('clicking "Desativar" calls deactivateTeamMember with member ID', async () => {
    (listTeamMembers as Mock).mockResolvedValue(mockMembers);
    (deactivateTeamMember as Mock).mockResolvedValue(undefined);
    const user = userEvent.setup();

    await renderTeamPage();

    await waitFor(() => {
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    });

    const deactivateButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent?.includes('Desativar'),
    );
    expect(deactivateButtons).toHaveLength(3);

    // Deactivate the first member (Carlos, id=1)
    await user.click(deactivateButtons[0]);

    await waitFor(() => {
      expect(deactivateTeamMember).toHaveBeenCalledWith(1);
    });
  });

  it('form fields name and email are required (have required attribute)', async () => {
    (listTeamMembers as Mock).mockResolvedValue([]);
    const user = userEvent.setup();

    await renderTeamPage();

    await waitFor(() => {
      expect(screen.getByText('A sua equipa está vazia')).toBeInTheDocument();
    });

    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Adicionar') && !btn.textContent?.includes('membro'),
    );
    await user.click(addButton!);

    const nameInput = screen.getByPlaceholderText('Nome');
    const emailInput = screen.getByPlaceholderText('Email');
    const phoneInput = screen.getByPlaceholderText('Telefone');

    expect(nameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(phoneInput).not.toBeRequired();
  });

  it('role select has options for OPERATOR, LEAD, and MANAGER', async () => {
    (listTeamMembers as Mock).mockResolvedValue([]);
    const user = userEvent.setup();

    await renderTeamPage();

    await waitFor(() => {
      expect(screen.getByText('A sua equipa está vazia')).toBeInTheDocument();
    });

    const addButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Adicionar') && !btn.textContent?.includes('membro'),
    );
    await user.click(addButton!);

    const roleSelect = screen.getByRole('combobox');
    const options = within(roleSelect).getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue('OPERATOR');
    expect(options[1]).toHaveValue('LEAD');
    expect(options[2]).toHaveValue('MANAGER');
  });
});
