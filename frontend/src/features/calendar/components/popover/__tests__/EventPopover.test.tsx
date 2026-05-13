import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CalendarEvent } from '@/types/calendar';
import { EventPopover } from '../EventPopover';

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
});
