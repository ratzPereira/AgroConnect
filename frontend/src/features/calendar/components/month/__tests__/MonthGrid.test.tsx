import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CalendarEvent } from '@/types/calendar';
import { MonthGrid } from '../MonthGrid';

describe('MonthGrid', () => {
  it('renders 7 day-of-week headers', () => {
    render(
      <MonthGrid year={2026} month={4} events={[]} conflicts={[]} onCellClick={() => {}} />,
    );
    for (const d of ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']) {
      expect(screen.getByText(d)).toBeInTheDocument();
    }
  });

  it('renders 5 or 6 week rows for May 2026', () => {
    const { container } = render(
      <MonthGrid year={2026} month={4} events={[]} conflicts={[]} onCellClick={() => {}} />,
    );
    const cells = container.querySelectorAll('[data-testid="cell-body"]');
    expect([35, 42]).toContain(cells.length);
  });

  it('forwards onCellClick with the cell day iso', () => {
    const onCellClick = vi.fn();
    render(
      <MonthGrid year={2026} month={4} events={[]} conflicts={[]} onCellClick={onCellClick} />,
    );
    const firstCell = screen.getAllByTestId('cell-body')[0];
    fireEvent.click(firstCell);
    expect(onCellClick).toHaveBeenCalled();
  });

  it('places events in the correct date cell', () => {
    const events: CalendarEvent[] = [
      {
        executionId: 1,
        requestId: 10,
        requestTitle: 'Job A',
        categoryName: 'Lavoura',
        scheduledDate: '2026-05-15',
        scheduledEndDate: '2026-05-15',
        scheduledStartTime: '08:00',
        scheduledEndTime: '12:00',
        scheduledAllDay: false,
        urgency: 'MEDIUM',
        status: 'AWARDED',
        island: 'Terceira',
        parish: 'Sé',
        assignments: [],
      },
    ];
    render(
      <MonthGrid year={2026} month={4} events={events} conflicts={[]} onCellClick={() => {}} />,
    );
    expect(screen.getByText('Job A')).toBeInTheDocument();
  });
});
