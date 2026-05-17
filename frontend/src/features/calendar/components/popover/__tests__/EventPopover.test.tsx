import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CalendarEvent } from '@/types/calendar';

const completeExecutionMock = vi.fn();
const listTeamMembersMock = vi.fn();
const reassignMutateAsync = vi.fn();

vi.mock('@/api/executions', () => ({
  completeExecution: (...args: unknown[]) => completeExecutionMock(...args),
}));

vi.mock('@/api/teamMembers', () => ({
  listTeamMembers: (...args: unknown[]) => listTeamMembersMock(...args),
}));

vi.mock('../../../hooks/useCalendar', () => ({
  useReassignExecution: () => ({ mutateAsync: reassignMutateAsync, isPending: false }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { EventPopover } from '../EventPopover';
import { toast } from 'sonner';

beforeEach(() => {
  completeExecutionMock.mockReset();
  completeExecutionMock.mockResolvedValue({});
  listTeamMembersMock.mockReset();
  listTeamMembersMock.mockResolvedValue([
    { id: 5, name: 'Ana Costa', role: 'OPERATOR' },
    { id: 8, name: 'Bruno', role: 'OPERATOR' },
    { id: 9, name: 'Carla', role: 'LEAD' },
  ]);
  reassignMutateAsync.mockReset();
  reassignMutateAsync.mockResolvedValue({});
});

const baseEvent: CalendarEvent = {
  executionId: 21,
  requestId: 7,
  requestTitle: 'Lavoura batatas',
  categoryName: 'Preparação',
  scheduledDate: '2026-05-20',
  scheduledEndDate: '2026-05-20',
  scheduledStartTime: '09:00',
  scheduledEndTime: '12:00',
  scheduledAllDay: false,
  status: 'IN_PROGRESS',
  island: 'Terceira',
  parish: 'Angra do Heroísmo',
  urgency: 'HIGH',
  assignments: [
    { teamMemberId: 5, teamMemberName: 'Ana Costa', machineId: 9, machineName: 'Trator XL' },
  ],
};

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EventPopover', () => {
  it('renders title, status, time and assignments', () => {
    wrap(<EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={() => {}} />);
    expect(screen.getByText('Lavoura batatas')).toBeInTheDocument();
    expect(screen.getByText('Em execução')).toBeInTheDocument();
    expect(screen.getByText(/09:00–12:00/)).toBeInTheDocument();
    expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    expect(screen.getByText('Trator XL')).toBeInTheDocument();
  });

  it('shows "Concluir" action for IN_PROGRESS status', () => {
    wrap(<EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /Concluir/ })).toBeInTheDocument();
  });

  it('hides "Concluir" action for COMPLETED status', () => {
    const e = { ...baseEvent, status: 'COMPLETED' as const };
    wrap(<EventPopover event={e} anchor={{ x: 50, y: 50 }} onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /Concluir/ })).toBeNull();
  });

  it('opens the complete form when "Concluir" is clicked', () => {
    wrap(<EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Concluir/ }));
    expect(screen.getByPlaceholderText(/Observações finais/)).toBeInTheDocument();
  });

  it('opens the reassign form when "Reatribuir" is clicked', () => {
    wrap(<EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Reatribuir/ }));
    expect(screen.getByText(/Novo operador/)).toBeInTheDocument();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    wrap(<EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={onClose} />);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on outside mousedown', () => {
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <div>
            <EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={onClose} />
            <div data-testid="outside">outside</div>
          </div>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the X button is clicked', () => {
    const onClose = vi.fn();
    wrap(<EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows "Sem operador atribuído" when there are no assignments', () => {
    wrap(<EventPopover event={{ ...baseEvent, assignments: [] }} anchor={{ x: 50, y: 50 }} onClose={() => {}} />);
    expect(screen.getByText('Sem operador atribuído')).toBeInTheDocument();
  });

  it('shows "Dia inteiro" for all-day events', () => {
    wrap(
      <EventPopover
        event={{ ...baseEvent, scheduledAllDay: true, scheduledStartTime: null, scheduledEndTime: null }}
        anchor={{ x: 50, y: 50 }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Dia inteiro/)).toBeInTheDocument();
  });

  it('renders a date range for multi-day events', () => {
    wrap(
      <EventPopover
        event={{ ...baseEvent, scheduledDate: '2026-05-20', scheduledEndDate: '2026-05-22' }}
        anchor={{ x: 50, y: 50 }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/2026-05-20 → 2026-05-22/)).toBeInTheDocument();
  });

  it('renders the HIGH urgency badge', () => {
    wrap(<EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={() => {}} />);
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });

  it('cancel inside complete mode returns to idle', () => {
    wrap(<EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Concluir$/ }));
    expect(screen.getByPlaceholderText(/Observações finais/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByPlaceholderText(/Observações finais/)).toBeNull();
  });

  it('confirms completion via completeExecution and calls onClose on success', async () => {
    const onClose = vi.fn();
    wrap(<EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Concluir$/ }));
    fireEvent.change(screen.getByPlaceholderText(/Observações finais/), {
      target: { value: 'Tudo ok' },
    });
    fireEvent.change(screen.getByPlaceholderText(/herbicida/), {
      target: { value: '10L herbicida' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar conclusão' }));
    await waitFor(() => expect(completeExecutionMock).toHaveBeenCalledWith(21, {
      notes: 'Tudo ok',
      materialsUsed: '10L herbicida',
    }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalled();
  });

  it('shows error toast when completion fails', async () => {
    completeExecutionMock.mockRejectedValueOnce(new Error('boom'));
    wrap(<EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Concluir$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar conclusão' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('reassigns to the chosen team member when confirmed', async () => {
    const onClose = vi.fn();
    wrap(<EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Reatribuir$/ }));
    await waitFor(() => expect(listTeamMembersMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Bruno/ })).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '8' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Reatribuir$/ })[0]);
    await waitFor(() =>
      expect(reassignMutateAsync).toHaveBeenCalledWith({
        executionId: 21,
        data: { fromTeamMemberId: 5, toTeamMemberId: 8 },
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('hides "Reatribuir" when there is no current operator', () => {
    wrap(
      <EventPopover
        event={{ ...baseEvent, assignments: [] }}
        anchor={{ x: 50, y: 50 }}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: /Reatribuir/ })).toBeNull();
  });

  it('renders the "Ver detalhes" link to the request page', () => {
    wrap(<EventPopover event={baseEvent} anchor={{ x: 50, y: 50 }} onClose={() => {}} />);
    expect(screen.getByRole('link', { name: /Ver detalhes/ })).toHaveAttribute(
      'href',
      '/requests/7',
    );
  });
});
