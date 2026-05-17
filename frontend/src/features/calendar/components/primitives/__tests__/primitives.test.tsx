import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});
import type { CalendarEvent } from '@/types/calendar';
import { TimeAxis } from '../TimeAxis';
import { ResourceLane } from '../ResourceLane';
import { GanttBarV2 } from '../GanttBarV2';
import { AllDayBand } from '../AllDayBand';
import { GhostBar } from '../GhostBar';

const baseEvent: CalendarEvent = {
  executionId: 1,
  requestId: 11,
  requestTitle: 'Lavoura terreno A',
  categoryName: 'Preparação de Solo',
  scheduledDate: '2026-04-15',
  scheduledEndDate: '2026-04-15',
  scheduledStartTime: '09:00',
  scheduledEndTime: '12:00',
  scheduledAllDay: false,
  status: 'IN_PROGRESS',
  island: 'Terceira',
  parish: 'Angra do Heroísmo',
  urgency: 'MEDIUM',
  assignments: [
    { teamMemberId: 1, teamMemberName: 'João Silva', machineId: 2, machineName: 'Trator JD' },
  ],
};

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('TimeAxis', () => {
  it('renders hour labels from 06:00 to 20:00 for a single day', () => {
    wrap(<TimeAxis days={1} />);
    expect(screen.getByText('06:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('19:00')).toBeInTheDocument();
  });

  it('renders day labels when requested', () => {
    wrap(<TimeAxis days={2} showDayLabels dayLabels={['Seg 13', 'Ter 14']} />);
    expect(screen.getByText('Seg 13')).toBeInTheDocument();
    expect(screen.getByText('Ter 14')).toBeInTheDocument();
  });
});

describe('ResourceLane', () => {
  it('renders label and sublabel', () => {
    wrap(
      <ResourceLane label="João Silva" sublabel="Operador">
        <div>child</div>
      </ResourceLane>,
    );
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Operador')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});

describe('GanttBarV2', () => {
  it('renders the request title and times for a wide bar', () => {
    wrap(<GanttBarV2 event={baseEvent} startSlot={6} spanSlots={6} />);
    expect(screen.getByText('Lavoura terreno A')).toBeInTheDocument();
    expect(screen.getByText(/09:00–12:00/)).toBeInTheDocument();
  });

  it('omits time chip on very narrow bars', () => {
    wrap(<GanttBarV2 event={baseEvent} startSlot={6} spanSlots={2} />);
    expect(screen.queryByText(/09:00–12:00/)).not.toBeInTheDocument();
  });

  it('invokes onClick with the event', () => {
    const handler = vi.fn();
    wrap(<GanttBarV2 event={baseEvent} startSlot={6} spanSlots={6} onClick={handler} />);
    screen.getByText('Lavoura terreno A').closest('div[role="button"]')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(handler).toHaveBeenCalledOnce();
  });

  it('shows conflict underline when hasConflict is true', () => {
    const { container } = wrap(
      <GanttBarV2 event={baseEvent} startSlot={6} spanSlots={6} hasConflict />,
    );
    const bar = container.querySelector('[role="button"]');
    expect(bar?.className).toContain('border-b-2');
    expect(bar?.className).toContain('border-danger-500');
    expect(bar?.className).not.toContain('ring-offset');
  });
});

describe('GanttBarV2 (status-color migration)', () => {
  it('renders IN_PROGRESS event with primary status color', () => {
    const { container } = wrap(
      <GanttBarV2
        event={{ ...baseEvent, status: 'IN_PROGRESS' }}
        startSlot={0}
        spanSlots={8}
      />,
    );
    const bar = container.querySelector('[data-execution-id="1"]');
    expect(bar?.className).toContain('bg-primary');
  });

  it('renders AWARDED event with sky color', () => {
    const { container } = wrap(
      <GanttBarV2
        event={{ ...baseEvent, status: 'AWARDED' }}
        startSlot={0}
        spanSlots={8}
      />,
    );
    const bar = container.querySelector('[data-execution-id="1"]');
    expect(bar?.className).toContain('bg-sky');
  });

  it('uses underline border for conflict (not ring with offset)', () => {
    const { container } = wrap(
      <GanttBarV2 event={baseEvent} startSlot={0} spanSlots={8} hasConflict />,
    );
    const bar = container.querySelector('[data-execution-id="1"]');
    expect(bar?.className).toContain('border-b-2');
    expect(bar?.className).toContain('border-danger-500');
    expect(bar?.className).not.toContain('ring-offset');
  });
});

describe('AllDayBand', () => {
  it('lists all-day events and ignores timed ones', () => {
    const allDay: CalendarEvent = { ...baseEvent, executionId: 2, scheduledAllDay: true, scheduledStartTime: null, scheduledEndTime: null, requestTitle: 'Plantação' };
    wrap(<AllDayBand events={[baseEvent, allDay]} days={1} dayLabels={['2026-04-15']} />);
    expect(screen.getByText('Plantação')).toBeInTheDocument();
    expect(screen.queryByText('Lavoura terreno A')).not.toBeInTheDocument();
  });

  it('shows empty hint when no all-day events on the day', () => {
    wrap(<AllDayBand events={[baseEvent]} days={1} dayLabels={['2026-04-15']} />);
    expect(screen.getByText(/Sem eventos de dia inteiro/)).toBeInTheDocument();
  });

  it('invokes onEventClick when an event button is clicked', () => {
    const allDay: CalendarEvent = { ...baseEvent, executionId: 5, scheduledAllDay: true, requestTitle: 'Sementeira' };
    const onEventClick = vi.fn();
    wrap(<AllDayBand events={[allDay]} days={1} onEventClick={onEventClick} />);
    fireEvent.click(screen.getByText('Sementeira'));
    expect(onEventClick).toHaveBeenCalledWith(allDay, expect.anything());
  });

  it('navigates to the job detail when no onEventClick is provided', () => {
    navigateMock.mockClear();
    const allDay: CalendarEvent = { ...baseEvent, executionId: 7, requestId: 99, scheduledAllDay: true, requestTitle: 'Poda' };
    wrap(<AllDayBand events={[allDay]} days={1} />);
    fireEvent.click(screen.getByText('Poda'));
    expect(navigateMock).toHaveBeenCalledWith('/provider/requests/99');
  });

  it('renders custom rightActions in the band header', () => {
    wrap(
      <AllDayBand
        events={[]}
        days={1}
        rightActions={<span data-testid="right-action">+</span>}
      />,
    );
    expect(screen.getByTestId('right-action')).toBeInTheDocument();
  });

  it('filters events per day when given dayLabels for a multi-day view', () => {
    const dayA: CalendarEvent = {
      ...baseEvent,
      executionId: 21,
      scheduledAllDay: true,
      scheduledDate: '2026-04-15',
      scheduledEndDate: '2026-04-15',
      requestTitle: 'Evento A',
    };
    const dayB: CalendarEvent = {
      ...baseEvent,
      executionId: 22,
      scheduledAllDay: true,
      scheduledDate: '2026-04-16',
      scheduledEndDate: '2026-04-16',
      requestTitle: 'Evento B',
    };
    wrap(
      <AllDayBand
        events={[dayA, dayB]}
        days={2}
        dayLabels={['2026-04-15', '2026-04-16']}
      />,
    );
    expect(screen.getByText('Evento A')).toBeInTheDocument();
    expect(screen.getByText('Evento B')).toBeInTheDocument();
  });

  it('renders chip color by status not urgency', () => {
    const event: CalendarEvent = {
      ...baseEvent,
      executionId: 41,
      scheduledAllDay: true,
      status: 'AWAITING_CONFIRMATION',
      urgency: 'LOW',
      requestTitle: 'Trabalho A',
    };
    wrap(<AllDayBand events={[event]} days={1} dayLabels={['2026-04-15']} />);
    const btn = screen.getByRole('button', { name: /Trabalho A/i });
    expect(btn.className).toContain('bg-warning');
  });

  it('applies different status colors to AWARDED vs IN_PROGRESS events', () => {
    const awarded: CalendarEvent = {
      ...baseEvent,
      executionId: 51,
      scheduledAllDay: true,
      status: 'AWARDED',
      requestTitle: 'AwardedJob',
    };
    const inProgress: CalendarEvent = {
      ...baseEvent,
      executionId: 52,
      scheduledAllDay: true,
      status: 'IN_PROGRESS',
      requestTitle: 'RunningJob',
    };
    wrap(<AllDayBand events={[awarded, inProgress]} days={1} />);
    expect(screen.getByText('AwardedJob').className).toContain('bg-sky');
    expect(screen.getByText('RunningJob').className).toContain('bg-primary');
  });
});

describe('GhostBar', () => {
  it('renders the proposed time window', () => {
    wrap(<GhostBar startSlot={6} spanSlots={6} />);
    expect(screen.getByText(/Novo horário/)).toBeInTheDocument();
    expect(screen.getByText(/09:00–12:00/)).toBeInTheDocument();
  });

  it('uses danger styling when conflict flag is on', () => {
    const { container } = wrap(<GhostBar startSlot={6} spanSlots={6} hasConflict />);
    const ghost = container.firstChild as HTMLElement;
    expect(ghost.className).toMatch(/border-danger/);
  });
});
