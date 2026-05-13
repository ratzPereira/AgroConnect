import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

  it('shows conflict ring when hasConflict is true', () => {
    const { container } = wrap(
      <GanttBarV2 event={baseEvent} startSlot={6} spanSlots={6} hasConflict />,
    );
    const bar = container.querySelector('[role="button"]');
    expect(bar?.className).toMatch(/ring-danger/);
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
