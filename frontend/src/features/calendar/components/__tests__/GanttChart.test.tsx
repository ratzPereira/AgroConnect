import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GanttChart } from '../GanttChart';
import type { CalendarEvent, ConflictResponse } from '@/types/calendar';

vi.mock('../ConflictBanner', () => ({
  ConflictBanner: () => <div data-testid="conflict-banner" />,
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: Object.assign(() => <div />, {
    Rect: ({ className }: { className?: string }) => <div data-testid="skeleton-rect" className={className} />,
  }),
}));

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
      { teamMemberId: 1, teamMemberName: 'João Silva', machineId: 1, machineName: 'Trator Kubota' },
    ],
  },
  {
    executionId: 2,
    requestId: 11,
    requestTitle: 'Limpeza de terreno',
    categoryName: 'Limpeza',
    scheduledDate: '2026-03-15',
    scheduledEndDate: '2026-03-16',
    status: 'AWARDED',
    island: 'Terceira',
    parish: 'São Sebastião',
    urgency: 'HIGH',
    assignments: [],
  },
];

const mockConflicts: ConflictResponse[] = [];

describe('GanttChart', () => {
  const defaultProps = {
    events: mockEvents,
    conflicts: mockConflicts,
    isLoading: false,
    year: 2026,
    month: 2, // March (0-indexed)
    onChangeMonth: vi.fn(),
  };

  function renderChart(props = {}) {
    return render(
      <MemoryRouter>
        <GanttChart {...defaultProps} {...props} />
      </MemoryRouter>,
    );
  }

  it('renders chart container with month/year header', () => {
    renderChart();
    expect(screen.getByText('Março 2026')).toBeInTheDocument();
  });

  it('renders view toggle buttons', () => {
    renderChart();
    expect(screen.getByText('Trabalhos')).toBeInTheDocument();
    expect(screen.getByText('Equipa')).toBeInTheDocument();
    expect(screen.getByText('Máquinas')).toBeInTheDocument();
  });

  it('renders with events data and shows job count', () => {
    renderChart();
    expect(screen.getByText('2 trabalhos')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    renderChart();
    expect(screen.getByLabelText('Mês anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Mês seguinte')).toBeInTheDocument();
  });

  it('renders loading state with skeletons', () => {
    renderChart({ isLoading: true });
    const skeletons = screen.getAllByTestId('skeleton-rect');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders urgency legend', () => {
    renderChart();
    expect(screen.getByText('Urgente')).toBeInTheDocument();
    // "Alta" and "Média" may appear both in legend and in mobile agenda badges
    expect(screen.getAllByText('Alta').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Média').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Baixa')).toBeInTheDocument();
  });
});
