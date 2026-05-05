import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UpcomingJobsMini } from '../UpcomingJobsMini';
import type { CalendarEvent } from '@/types/calendar';

const mockEvents: CalendarEvent[] = [
  {
    executionId: 1,
    requestId: 10,
    requestTitle: 'Lavoura de terreno',
    categoryName: 'Preparação de Solo',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // tomorrow
    scheduledEndDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    status: 'IN_PROGRESS',
    island: 'Terceira',
    parish: 'Angra do Heroísmo',
    urgency: 'MEDIUM',
    assignments: [],
  },
  {
    executionId: 2,
    requestId: 11,
    requestTitle: 'Limpeza de mato',
    categoryName: 'Limpeza',
    scheduledDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    scheduledEndDate: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
    status: 'AWARDED',
    island: 'Terceira',
    parish: 'São Sebastião',
    urgency: 'HIGH',
    assignments: [],
  },
];

let mockIsLoading = false;
let mockData: CalendarEvent[] = mockEvents;

vi.mock('../../hooks/useCalendar', () => ({
  useCalendarEvents: vi.fn(() => ({
    data: mockData,
    isLoading: mockIsLoading,
  })),
}));

describe('UpcomingJobsMini', () => {
  beforeEach(() => {
    mockIsLoading = false;
    mockData = mockEvents;
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <UpcomingJobsMini />
      </MemoryRouter>,
    );
  }

  it('renders upcoming jobs list with header', () => {
    renderComponent();
    expect(screen.getByText('Próximos Trabalhos')).toBeInTheDocument();
  });

  it('renders event titles', () => {
    renderComponent();
    expect(screen.getByText('Lavoura de terreno')).toBeInTheDocument();
    expect(screen.getByText('Limpeza de mato')).toBeInTheDocument();
  });

  it('shows empty state when no jobs', () => {
    mockData = [];
    renderComponent();
    expect(screen.getByText('Sem trabalhos nas próximas 2 semanas')).toBeInTheDocument();
  });

  it('shows link to calendar', () => {
    renderComponent();
    expect(screen.getByText('Ver calendário')).toBeInTheDocument();
  });

  it('renders urgency badges', () => {
    renderComponent();
    expect(screen.getByText('Média')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });
});
