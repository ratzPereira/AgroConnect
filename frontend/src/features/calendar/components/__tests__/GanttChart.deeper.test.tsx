import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GanttChart } from '../GanttChart';
import type { CalendarEvent, ConflictResponse } from '@/types/calendar';

vi.mock('../GanttSidebar', () => ({
  GanttSidebar: ({ rows }: { rows: { id: string }[] }) => (
    <div data-testid="sidebar">{rows.length} rows</div>
  ),
}));

vi.mock('../GanttTimeline', () => ({
  GanttTimeline: ({ rows }: { rows: { id: string }[] }) => (
    <div data-testid="timeline">{rows.length} rows</div>
  ),
}));

vi.mock('../GanttMobileAgenda', () => ({
  GanttMobileAgenda: () => <div data-testid="mobile-agenda" />,
}));

vi.mock('../ConflictBanner', () => ({
  ConflictBanner: ({ conflicts }: { conflicts: ConflictResponse[] }) => (
    <div data-testid="conflict-banner">{conflicts.length}</div>
  ),
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: Object.assign(() => null, {
    Rect: (props: { className?: string }) => <div data-testid="skeleton-rect" className={props.className} />,
  }),
}));

const mockEvent: CalendarEvent = {
  executionId: 1,
  requestId: 10,
  requestTitle: 'Lavoura de terreno',
  categoryName: 'Lavoura',
  scheduledDate: '2026-03-15',
  scheduledEndDate: '2026-03-16',
  urgency: 'HIGH',
  status: 'IN_PROGRESS',
  island: 'São Miguel',
  parish: 'Ponta Delgada',
  assignments: [
    { teamMemberId: 1, teamMemberName: 'João', machineId: 5, machineName: 'Trator A' },
  ],
};

const mockEvent2: CalendarEvent = {
  executionId: 2,
  requestId: 11,
  requestTitle: 'Limpeza de terreno',
  categoryName: 'Limpeza',
  scheduledDate: '2026-03-20',
  scheduledEndDate: '2026-03-21',
  urgency: 'MEDIUM',
  status: 'AWARDED',
  island: 'Terceira',
  parish: 'Angra do Heroísmo',
  assignments: [
    { teamMemberId: 2, teamMemberName: 'Maria', machineId: 6, machineName: 'Pulverizador B' },
  ],
};

describe('GanttChart (deeper)', () => {
  let onChangeMonth: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChangeMonth = vi.fn();
  });

  function renderChart(props: Partial<Parameters<typeof GanttChart>[0]> = {}) {
    const defaultProps = {
      events: [mockEvent, mockEvent2],
      conflicts: [] as ConflictResponse[],
      isLoading: false,
      year: 2026,
      month: 2, // March (0-indexed)
      onChangeMonth,
    };
    return render(
      <MemoryRouter>
        <GanttChart {...defaultProps} {...props} />
      </MemoryRouter>,
    );
  }

  it('renders month name and year in the header', () => {
    renderChart({ year: 2026, month: 2 });
    expect(screen.getByText('Março 2026')).toBeInTheDocument();
  });

  it('prev button calls onChangeMonth with previous month', () => {
    renderChart({ year: 2026, month: 5 }); // June
    fireEvent.click(screen.getByLabelText('Mês anterior'));
    expect(onChangeMonth).toHaveBeenCalledWith(2026, 4); // May
  });

  it('next button calls onChangeMonth with next month', () => {
    renderChart({ year: 2026, month: 5 }); // June
    fireEvent.click(screen.getByLabelText('Mês seguinte'));
    expect(onChangeMonth).toHaveBeenCalledWith(2026, 6); // July
  });

  it('prev from January wraps to December of previous year', () => {
    renderChart({ year: 2026, month: 0 }); // January
    expect(screen.getByText('Janeiro 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Mês anterior'));
    expect(onChangeMonth).toHaveBeenCalledWith(2025, 11); // December 2025
  });

  it('next from December wraps to January of next year', () => {
    renderChart({ year: 2026, month: 11 }); // December
    expect(screen.getByText('Dezembro 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Mês seguinte'));
    expect(onChangeMonth).toHaveBeenCalledWith(2027, 0); // January 2027
  });

  it('shows "Hoje" button when not on current month', () => {
    // Use a date far from current month to ensure we are not on the current month
    renderChart({ year: 2020, month: 0 }); // January 2020 — definitely not current
    expect(screen.getByText('Hoje')).toBeInTheDocument();
  });

  it('hides "Hoje" button when on the current month', () => {
    const now = new Date();
    renderChart({ year: now.getFullYear(), month: now.getMonth() });
    expect(screen.queryByText('Hoje')).not.toBeInTheDocument();
  });

  it('clicking "Hoje" calls onChangeMonth with current year and month', () => {
    renderChart({ year: 2020, month: 0 });
    fireEvent.click(screen.getByText('Hoje'));
    const now = new Date();
    expect(onChangeMonth).toHaveBeenCalledWith(now.getFullYear(), now.getMonth());
  });

  it('renders view toggle buttons (Trabalhos, Equipa, Máquinas)', () => {
    renderChart();
    expect(screen.getByText('Trabalhos')).toBeInTheDocument();
    expect(screen.getByText('Equipa')).toBeInTheDocument();
    expect(screen.getByText('Máquinas')).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading is true', () => {
    renderChart({ isLoading: true });
    const skeletons = screen.getAllByTestId('skeleton-rect');
    expect(skeletons.length).toBe(2);
  });

  it('hides sidebar and timeline during loading', () => {
    renderChart({ isLoading: true });
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('timeline')).not.toBeInTheDocument();
  });

  it('renders sidebar and timeline when not loading', () => {
    renderChart({ isLoading: false });
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
  });

  it('renders summary bar with correct event count', () => {
    renderChart({ events: [mockEvent, mockEvent2] });
    expect(screen.getByText('2 trabalhos')).toBeInTheDocument();
  });

  it('renders singular "trabalho" for single event', () => {
    renderChart({ events: [mockEvent] });
    expect(screen.getByText('1 trabalho')).toBeInTheDocument();
  });

  it('does not render summary bar when events are empty', () => {
    renderChart({ events: [] });
    expect(screen.queryByText(/trabalho/)).not.toBeInTheDocument();
  });

  it('renders ConflictBanner with conflicts prop', () => {
    const conflicts: ConflictResponse[] = [
      {
        date: '2026-03-15',
        resourceType: 'TEAM_MEMBER',
        resourceId: 1,
        resourceName: 'João',
        conflictingEvents: [
          { executionId: 1, requestTitle: 'Lavoura de terreno' },
          { executionId: 2, requestTitle: 'Limpeza de terreno' },
        ],
      },
    ];
    renderChart({ conflicts });
    const banner = screen.getByTestId('conflict-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('1');
  });

  it('clicking view toggle changes rows passed to sidebar', () => {
    renderChart({ events: [mockEvent, mockEvent2] });

    // Default is "jobs" view: one row per event = 2 rows
    expect(screen.getByTestId('sidebar')).toHaveTextContent('2 rows');

    // Switch to "team" view: groups by team member (João, Maria) = 2 rows
    fireEvent.click(screen.getByText('Equipa'));
    expect(screen.getByTestId('sidebar')).toHaveTextContent('2 rows');

    // Switch to "machines" view: groups by machine (Trator A, Pulverizador B) = 2 rows
    fireEvent.click(screen.getByText('Máquinas'));
    expect(screen.getByTestId('sidebar')).toHaveTextContent('2 rows');
  });

  it('team view groups multiple events by the same team member', () => {
    const eventsSameMember: CalendarEvent[] = [
      {
        ...mockEvent,
        executionId: 1,
        assignments: [{ teamMemberId: 1, teamMemberName: 'João', machineId: 5, machineName: 'Trator A' }],
      },
      {
        ...mockEvent2,
        executionId: 2,
        assignments: [{ teamMemberId: 1, teamMemberName: 'João', machineId: 6, machineName: 'Pulverizador B' }],
      },
    ];
    renderChart({ events: eventsSameMember });

    fireEvent.click(screen.getByText('Equipa'));
    // Same team member => 1 row
    expect(screen.getByTestId('sidebar')).toHaveTextContent('1 rows');
  });

  it('machines view excludes assignments without a machine', () => {
    const eventsNoMachine: CalendarEvent[] = [
      {
        ...mockEvent,
        executionId: 1,
        assignments: [{ teamMemberId: 1, teamMemberName: 'João', machineId: null, machineName: null }],
      },
    ];
    renderChart({ events: eventsNoMachine });

    fireEvent.click(screen.getByText('Máquinas'));
    // No machines => 0 rows
    expect(screen.getByTestId('sidebar')).toHaveTextContent('0 rows');
  });

  it('renders urgency legend labels', () => {
    renderChart();
    expect(screen.getByText('Urgente')).toBeInTheDocument();
    expect(screen.getByText('Baixa')).toBeInTheDocument();
  });

  it('renders mobile agenda component', () => {
    renderChart();
    expect(screen.getByTestId('mobile-agenda')).toBeInTheDocument();
  });
});
