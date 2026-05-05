import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GanttMobileAgenda } from '../GanttMobileAgenda';
import type { CalendarEvent } from '@/types/calendar';

const mockEvents: CalendarEvent[] = [
  {
    executionId: 1,
    requestId: 10,
    requestTitle: 'Lavoura de terreno',
    categoryName: 'Preparação de Solo',
    scheduledDate: '2026-03-10',
    scheduledEndDate: '2026-03-12',
    status: 'IN_PROGRESS',
    island: 'Terceira',
    parish: 'Angra do Heroísmo',
    urgency: 'MEDIUM',
    assignments: [
      { teamMemberId: 1, teamMemberName: 'João Silva', machineId: null, machineName: null },
    ],
  },
  {
    executionId: 2,
    requestId: 11,
    requestTitle: 'Limpeza de mato',
    categoryName: 'Limpeza',
    scheduledDate: '2026-03-15',
    scheduledEndDate: '2026-03-15',
    status: 'AWARDED',
    island: 'Terceira',
    parish: 'São Sebastião',
    urgency: 'HIGH',
    assignments: [],
  },
];

describe('GanttMobileAgenda', () => {
  function renderAgenda(events = mockEvents) {
    return render(
      <MemoryRouter>
        <GanttMobileAgenda events={events} year={2026} month={2} />
      </MemoryRouter>,
    );
  }

  it('renders agenda items with event titles', () => {
    renderAgenda();
    // Multi-day events appear on multiple day entries
    expect(screen.getAllByText('Lavoura de terreno').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Limpeza de mato').length).toBeGreaterThanOrEqual(1);
  });

  it('renders category names', () => {
    renderAgenda();
    // Multi-day events repeat category names across day entries
    expect(screen.getAllByText('Preparação de Solo').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Limpeza').length).toBeGreaterThanOrEqual(1);
  });

  it('renders location info', () => {
    renderAgenda();
    expect(screen.getAllByText(/Angra do Heroísmo/).length).toBeGreaterThan(0);
  });

  it('shows empty state when no events', () => {
    renderAgenda([]);
    expect(screen.getByText('Sem trabalhos agendados neste mês')).toBeInTheDocument();
  });

  it('renders urgency badges', () => {
    renderAgenda();
    // Multi-day events appear on multiple days, so there may be multiple badges
    expect(screen.getAllByText('Média').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Alta').length).toBeGreaterThanOrEqual(1);
  });
});
