import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekEventCard } from '../WeekEventCard';
import type { CalendarEvent } from '@/types/calendar';

const baseEvent: CalendarEvent = {
  executionId: 1,
  requestId: 10,
  requestTitle: 'Lavoura no pomar',
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
  assignments: [
    { teamMemberId: 1, teamMemberName: 'João Silva', machineId: 5, machineName: 'Trator JD' },
  ],
};

describe('WeekEventCard', () => {
  it('renders title, time range and operator name', () => {
    render(
      <WeekEventCard
        event={baseEvent}
        top={0}
        height={224}
        laneIndex={0}
        laneCount={1}
        hasConflict={false}
      />,
    );
    expect(screen.getByText(/Lavoura no pomar/)).toBeInTheDocument();
    expect(screen.getByText(/08:00.*12:00/)).toBeInTheDocument();
    expect(screen.getByText(/João/)).toBeInTheDocument();
  });

  it('positions absolutely using top/height', () => {
    const { container } = render(
      <WeekEventCard
        event={baseEvent}
        top={100}
        height={224}
        laneIndex={0}
        laneCount={1}
        hasConflict={false}
      />,
    );
    const card = container.querySelector('[data-execution-id="1"]') as HTMLElement;
    expect(card.style.top).toBe('100px');
    expect(card.style.height).toBe('224px');
  });

  it('splits width when laneCount > 1', () => {
    const { container } = render(
      <WeekEventCard
        event={baseEvent}
        top={0}
        height={224}
        laneIndex={1}
        laneCount={3}
        hasConflict={false}
      />,
    );
    const card = container.querySelector('[data-execution-id="1"]') as HTMLElement;
    expect(card.style.left).toMatch(/3[1-4]\./);
    expect(card.style.width).toMatch(/3[1-4]\./);
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <WeekEventCard
        event={baseEvent}
        top={0}
        height={224}
        laneIndex={0}
        laneCount={1}
        hasConflict={false}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Lavoura no pomar/i }));
    expect(onClick).toHaveBeenCalledWith(baseEvent, expect.anything());
  });
});
