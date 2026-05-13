import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { CalendarEvent } from '@/types/calendar';
import { WeekView } from '../WeekView';
import { rangeForView } from '../../../utils/viewRange';

const event: CalendarEvent = {
  executionId: 1,
  requestId: 11,
  requestTitle: 'Lavoura A',
  categoryName: 'Preparação',
  scheduledDate: '2026-04-15',
  scheduledEndDate: '2026-04-15',
  scheduledStartTime: '09:00',
  scheduledEndTime: '12:00',
  scheduledAllDay: false,
  status: 'IN_PROGRESS',
  island: 'Terceira',
  parish: 'Angra do Heroísmo',
  urgency: 'MEDIUM',
  assignments: [{ teamMemberId: 1, teamMemberName: 'João Silva', machineId: null, machineName: null }],
};

const multiDayEvent: CalendarEvent = {
  ...event,
  executionId: 2,
  requestTitle: 'Limpeza multi',
  scheduledDate: '2026-04-14',
  scheduledEndDate: '2026-04-16',
  scheduledStartTime: null,
  scheduledEndTime: null,
  scheduledAllDay: true,
};

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('WeekView', () => {
  const range = rangeForView('week', '2026-04-15');

  it('renders the seven-day axis with day labels', () => {
    wrap(
      <WeekView events={[event]} conflicts={[]} days={range.days} lane="operators" />,
    );
    expect(screen.getByText(/seg 13/)).toBeInTheDocument();
    expect(screen.getByText(/dom 19/)).toBeInTheDocument();
  });

  it('renders events across the operator lane', () => {
    wrap(<WeekView events={[event]} conflicts={[]} days={range.days} lane="operators" />);
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Lavoura A')).toBeInTheDocument();
  });

  it('shows multi-day all-day events in the band', () => {
    wrap(<WeekView events={[multiDayEvent]} conflicts={[]} days={range.days} lane="operators" />);
    expect(screen.getAllByText('Limpeza multi').length).toBeGreaterThan(0);
  });

  it('falls back to empty state when no events', () => {
    wrap(<WeekView events={[]} conflicts={[]} days={range.days} lane="operators" />);
    expect(screen.getByText(/Sem eventos para esta semana/)).toBeInTheDocument();
  });
});
