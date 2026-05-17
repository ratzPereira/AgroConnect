import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CalendarEvent } from '@/types/calendar';
import { MonthEventChip } from '../MonthEventChip';

const evt: CalendarEvent = {
  executionId: 1,
  requestId: 10,
  requestTitle: 'Lavoura',
  categoryName: 'Lavoura',
  scheduledDate: '2026-05-17',
  scheduledEndDate: '2026-05-17',
  scheduledStartTime: '08:00',
  scheduledEndTime: '12:00',
  scheduledAllDay: false,
  urgency: 'MEDIUM',
  status: 'AWARDED',
  island: 'Terceira',
  parish: 'Sé',
  assignments: [],
};

describe('MonthEventChip', () => {
  it('shows time and title', () => {
    render(<MonthEventChip event={evt} hasConflict={false} />);
    expect(screen.getByText(/08:00/)).toBeInTheDocument();
    expect(screen.getByText(/Lavoura/)).toBeInTheDocument();
  });

  it('shows ALL when all-day', () => {
    const allDay: CalendarEvent = { ...evt, scheduledAllDay: true };
    render(<MonthEventChip event={allDay} hasConflict={false} />);
    expect(screen.getByText(/dia inteiro/i)).toBeInTheDocument();
  });

  it('calls onClick', () => {
    const onClick = vi.fn();
    render(<MonthEventChip event={evt} hasConflict={false} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(evt, expect.anything());
  });
});
