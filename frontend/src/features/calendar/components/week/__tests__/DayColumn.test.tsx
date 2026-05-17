import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayColumn } from '../DayColumn';
import type { CalendarEvent } from '@/types/calendar';

const events: CalendarEvent[] = [
  {
    executionId: 1,
    requestId: 10,
    requestTitle: 'Trabalho A',
    categoryName: 'Lavoura',
    scheduledDate: '2026-05-17',
    scheduledEndDate: '2026-05-17',
    scheduledStartTime: '08:00',
    scheduledEndTime: '12:00',
    scheduledAllDay: false,
    urgency: 'MEDIUM',
    status: 'IN_PROGRESS',
    island: 'Terceira',
    parish: 'Sé',
    assignments: [],
  },
];

describe('DayColumn', () => {
  it('renders cards for events on this day', () => {
    render(
      <DayColumn dayIso="2026-05-17" events={events} conflictSet={new Set()} isToday={false} />,
    );
    expect(screen.getByText('Trabalho A')).toBeInTheDocument();
  });

  it('does not render cards for events on another day', () => {
    render(
      <DayColumn dayIso="2026-05-18" events={events} conflictSet={new Set()} isToday={false} />,
    );
    expect(screen.queryByText('Trabalho A')).not.toBeInTheDocument();
  });

  it('shows "now" line when isToday is true', () => {
    const { container } = render(
      <DayColumn dayIso="2026-05-17" events={[]} conflictSet={new Set()} isToday={true} />,
    );
    expect(container.querySelector('[data-testid="now-line"]')).not.toBeNull();
  });

  it('does NOT show "now" line when isToday is false', () => {
    const { container } = render(
      <DayColumn dayIso="2026-05-17" events={[]} conflictSet={new Set()} isToday={false} />,
    );
    expect(container.querySelector('[data-testid="now-line"]')).toBeNull();
  });

  it('renders hour grid lines', () => {
    const { container } = render(
      <DayColumn dayIso="2026-05-17" events={[]} conflictSet={new Set()} isToday={false} />,
    );
    expect(container.querySelectorAll('[data-testid="hour-line"]').length).toBeGreaterThan(0);
  });
});
