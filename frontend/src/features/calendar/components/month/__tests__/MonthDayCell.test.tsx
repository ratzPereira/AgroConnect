import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CalendarEvent } from '@/types/calendar';
import type { RequestStatus } from '@/types/request';
import { MonthDayCell } from '../MonthDayCell';

function evt(id: number, status: RequestStatus = 'AWARDED'): CalendarEvent {
  return {
    executionId: id,
    requestId: 100 + id,
    requestTitle: `Job ${id}`,
    categoryName: 'Lavoura',
    scheduledDate: '2026-05-17',
    scheduledEndDate: '2026-05-17',
    scheduledStartTime: '08:00',
    scheduledEndTime: '12:00',
    scheduledAllDay: false,
    urgency: 'MEDIUM',
    status,
    island: 'Terceira',
    parish: 'Sé',
    assignments: [],
  };
}

describe('MonthDayCell', () => {
  it('shows day number', () => {
    render(
      <MonthDayCell
        dayIso="2026-05-17"
        events={[]}
        conflictSet={new Set()}
        isCurrentMonth
        isToday={false}
        loadIntensity={0}
        onCellClick={() => {}}
      />,
    );
    expect(screen.getByText('17')).toBeInTheDocument();
  });

  it('renders up to 3 chips visible', () => {
    const events = Array.from({ length: 5 }, (_, i) => evt(i + 1));
    render(
      <MonthDayCell
        dayIso="2026-05-17"
        events={events}
        conflictSet={new Set()}
        isCurrentMonth
        isToday={false}
        loadIntensity={0}
        onCellClick={() => {}}
      />,
    );
    expect(screen.getAllByRole('button', { name: /Job/ })).toHaveLength(3);
    expect(screen.getByText(/\+2 mais/)).toBeInTheDocument();
  });

  it('shows today ring when isToday', () => {
    const { container } = render(
      <MonthDayCell
        dayIso="2026-05-17"
        events={[]}
        conflictSet={new Set()}
        isCurrentMonth
        isToday
        loadIntensity={0}
        onCellClick={() => {}}
      />,
    );
    expect((container.firstChild as HTMLElement).className).toContain('ring-2');
  });

  it('dims days from other months', () => {
    const { container } = render(
      <MonthDayCell
        dayIso="2026-04-30"
        events={[]}
        conflictSet={new Set()}
        isCurrentMonth={false}
        isToday={false}
        loadIntensity={0}
        onCellClick={() => {}}
      />,
    );
    expect((container.firstChild as HTMLElement).className).toContain('text-neutral-400');
  });

  it('shows conflict dot when any event has a conflict', () => {
    const { container } = render(
      <MonthDayCell
        dayIso="2026-05-17"
        events={[evt(1)]}
        conflictSet={new Set([1])}
        isCurrentMonth
        isToday={false}
        loadIntensity={0}
        onCellClick={() => {}}
      />,
    );
    expect(container.querySelector('[data-testid="conflict-dot"]')).not.toBeNull();
  });

  it('opens overflow popover when +N more clicked', () => {
    const events = Array.from({ length: 5 }, (_, i) => evt(i + 1));
    render(
      <MonthDayCell
        dayIso="2026-05-17"
        events={events}
        conflictSet={new Set()}
        isCurrentMonth
        isToday={false}
        loadIntensity={0}
        onCellClick={() => {}}
      />,
    );
    fireEvent.click(screen.getByText(/\+2 mais/));
    for (let i = 1; i <= 5; i++) {
      expect(screen.getAllByText(`Job ${i}`).length).toBeGreaterThan(0);
    }
  });

  it('calls onCellClick when bare cell area clicked', () => {
    const onCellClick = vi.fn();
    render(
      <MonthDayCell
        dayIso="2026-05-17"
        events={[]}
        conflictSet={new Set()}
        isCurrentMonth
        isToday={false}
        loadIntensity={0}
        onCellClick={onCellClick}
      />,
    );
    fireEvent.click(screen.getByTestId('cell-body'));
    expect(onCellClick).toHaveBeenCalledWith('2026-05-17');
  });
});
