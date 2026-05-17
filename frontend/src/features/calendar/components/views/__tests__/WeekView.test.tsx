import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WeekView } from '../WeekView';
import type { CalendarEvent } from '@/types/calendar';

const days = [
  '2026-05-11',
  '2026-05-12',
  '2026-05-13',
  '2026-05-14',
  '2026-05-15',
  '2026-05-16',
  '2026-05-17',
];

function evt(id: number, dayIso: string, start: string, end: string): CalendarEvent {
  return {
    executionId: id,
    requestId: id + 100,
    requestTitle: `Job ${id}`,
    categoryName: 'Lavoura',
    scheduledDate: dayIso,
    scheduledEndDate: dayIso,
    scheduledStartTime: start,
    scheduledEndTime: end,
    scheduledAllDay: false,
    urgency: 'MEDIUM',
    status: 'AWARDED',
    island: 'Terceira',
    parish: 'Sé',
    assignments: [],
  };
}

describe('WeekView (time-grid)', () => {
  it('renders 7 day columns with day labels', () => {
    render(
      <MemoryRouter>
        <WeekView events={[]} conflicts={[]} days={days} lane="operators" />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Seg/i)).toBeInTheDocument();
    expect(screen.getByText(/Dom/i)).toBeInTheDocument();
  });

  it('renders hour gutter labels', () => {
    render(
      <MemoryRouter>
        <WeekView events={[]} conflicts={[]} days={days} lane="operators" />
      </MemoryRouter>,
    );
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
  });

  it('renders events in the correct day column', () => {
    render(
      <MemoryRouter>
        <WeekView
          events={[evt(1, '2026-05-13', '08:00', '12:00')]}
          conflicts={[]}
          days={days}
          lane="operators"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Job 1')).toBeInTheDocument();
  });

  it('shows empty state when no events and emptyState prop provided', () => {
    render(
      <MemoryRouter>
        <WeekView
          events={[]}
          conflicts={[]}
          days={days}
          lane="operators"
          emptyState={<div>Vazio</div>}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Vazio')).toBeInTheDocument();
  });
});
