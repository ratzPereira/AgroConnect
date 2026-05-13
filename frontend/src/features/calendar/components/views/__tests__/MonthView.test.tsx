import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { CalendarEvent } from '@/types/calendar';
import { MonthView } from '../MonthView';

const event: CalendarEvent = {
  executionId: 1,
  requestId: 11,
  requestTitle: 'Lavoura A',
  categoryName: 'Preparação',
  scheduledDate: '2026-04-15',
  scheduledEndDate: '2026-04-17',
  scheduledStartTime: null,
  scheduledEndTime: null,
  scheduledAllDay: true,
  status: 'IN_PROGRESS',
  island: 'Terceira',
  parish: 'Angra do Heroísmo',
  urgency: 'MEDIUM',
  assignments: [{ teamMemberId: 1, teamMemberName: 'João Silva', machineId: 2, machineName: 'Trator JD' }],
};

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('MonthView', () => {
  it('renders job lanes by default', () => {
    wrap(<MonthView events={[event]} conflicts={[]} year={2026} month={3} lane="jobs" />);
    expect(screen.getAllByText('Lavoura A').length).toBeGreaterThan(0);
  });

  it('renders empty state when no events', () => {
    wrap(<MonthView events={[]} conflicts={[]} year={2026} month={3} lane="jobs" />);
    expect(screen.getByText(/Sem eventos para este mês/)).toBeInTheDocument();
  });

  it('groups by team when lane is operators', () => {
    wrap(<MonthView events={[event]} conflicts={[]} year={2026} month={3} lane="operators" />);
    expect(screen.getAllByText('João Silva').length).toBeGreaterThan(0);
  });

  it('groups by machine when lane is machines', () => {
    wrap(<MonthView events={[event]} conflicts={[]} year={2026} month={3} lane="machines" />);
    expect(screen.getAllByText('Trator JD').length).toBeGreaterThan(0);
  });
});
