import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPopover } from '../FilterPopover';
import type { CalendarEvent } from '@/types/calendar';
import type { CalendarFilters } from '../../../hooks/useCalendarFilters';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    executionId: 1,
    requestId: 1,
    requestTitle: 'Job',
    categoryName: 'Limpeza',
    scheduledDate: '2026-04-15',
    scheduledEndDate: '2026-04-15',
    scheduledStartTime: '09:00',
    scheduledEndTime: '11:00',
    scheduledAllDay: false,
    status: 'IN_PROGRESS',
    island: 'São Miguel',
    parish: 'Ponta Delgada',
    urgency: 'MEDIUM',
    assignments: [
      { teamMemberId: 1, teamMemberName: 'João', machineId: 5, machineName: 'Trator' },
    ],
    ...overrides,
  };
}

function emptyFilters(overrides: Partial<CalendarFilters> = {}): CalendarFilters {
  return {
    operatorIds: [],
    machineIds: [],
    categories: [],
    urgencies: [],
    statuses: [],
    includeAllDay: true,
    islands: [],
    ...overrides,
  };
}

describe('FilterPopover', () => {
  it('renders the trigger button closed by default', () => {
    render(
      <FilterPopover events={[]} filters={emptyFilters()} onChange={vi.fn()} onClear={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /Filtros/i })).toBeInTheDocument();
    expect(screen.queryByText('Filtrar agenda')).not.toBeInTheDocument();
  });

  it('opens the panel when the trigger is clicked', () => {
    render(
      <FilterPopover events={[makeEvent()]} filters={emptyFilters()} onChange={vi.fn()} onClear={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    expect(screen.getByText('Filtrar agenda')).toBeInTheDocument();
  });

  it('closes on a second click on the trigger', () => {
    render(
      <FilterPopover events={[]} filters={emptyFilters()} onChange={vi.fn()} onClear={vi.fn()} />,
    );
    const trigger = screen.getByRole('button', { name: /Filtros/i });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(screen.queryByText('Filtrar agenda')).not.toBeInTheDocument();
  });

  it('shows the active filter count badge', () => {
    render(
      <FilterPopover
        events={[]}
        filters={emptyFilters({ urgencies: ['HIGH'], operatorIds: [1] })}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Filtros/i })).toHaveTextContent('2');
  });

  it('counts excluded all-day as an active filter', () => {
    render(
      <FilterPopover
        events={[]}
        filters={emptyFilters({ includeAllDay: false })}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Filtros/i })).toHaveTextContent('1');
  });

  it('calls onChange when an urgency chip is toggled', () => {
    const onChange = vi.fn();
    render(
      <FilterPopover events={[makeEvent()]} filters={emptyFilters()} onChange={onChange} onClear={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Alta' }));
    expect(onChange).toHaveBeenCalledWith({ urgencies: ['HIGH'] });
  });

  it('toggles an already-selected urgency off', () => {
    const onChange = vi.fn();
    render(
      <FilterPopover
        events={[makeEvent()]}
        filters={emptyFilters({ urgencies: ['HIGH', 'LOW'] })}
        onChange={onChange}
        onClear={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Alta' }));
    expect(onChange).toHaveBeenCalledWith({ urgencies: ['LOW'] });
  });

  it('renders status chips derived from events', () => {
    render(
      <FilterPopover
        events={[makeEvent({ status: 'IN_PROGRESS' }), makeEvent({ executionId: 2, status: 'COMPLETED' })]}
        filters={emptyFilters()}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    expect(screen.getByRole('button', { name: 'Em curso' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluído' })).toBeInTheDocument();
  });

  it('renders operator chips and machine chips from assignments', () => {
    render(
      <FilterPopover events={[makeEvent()]} filters={emptyFilters()} onChange={vi.fn()} onClear={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    expect(screen.getByRole('button', { name: 'João' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trator' })).toBeInTheDocument();
  });

  it('falls back to "Máquina #N" when machineName is null', () => {
    const ev = makeEvent({
      assignments: [{ teamMemberId: 1, teamMemberName: 'X', machineId: 9, machineName: null }],
    });
    render(
      <FilterPopover events={[ev]} filters={emptyFilters()} onChange={vi.fn()} onClear={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    expect(screen.getByRole('button', { name: 'Máquina #9' })).toBeInTheDocument();
  });

  it('shows a "Limpar" button when there are active filters and triggers onClear', () => {
    const onClear = vi.fn();
    render(
      <FilterPopover
        events={[]}
        filters={emptyFilters({ urgencies: ['HIGH'] })}
        onChange={vi.fn()}
        onClear={onClear}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('toggles includeAllDay via the checkbox', () => {
    const onChange = vi.fn();
    render(
      <FilterPopover events={[]} filters={emptyFilters()} onChange={onChange} onClear={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith({ includeAllDay: false });
  });

  it('closes the panel on outside click', () => {
    render(
      <div>
        <FilterPopover events={[]} filters={emptyFilters()} onChange={vi.fn()} onClear={vi.fn()} />
        <div data-testid="outside">outside</div>
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    expect(screen.getByText('Filtrar agenda')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Filtrar agenda')).not.toBeInTheDocument();
  });

  it('does not close when clicking inside the panel', () => {
    render(
      <FilterPopover events={[makeEvent()]} filters={emptyFilters()} onChange={vi.fn()} onClear={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));
    fireEvent.mouseDown(screen.getByText('Filtrar agenda'));
    expect(screen.getByText('Filtrar agenda')).toBeInTheDocument();
  });
});
