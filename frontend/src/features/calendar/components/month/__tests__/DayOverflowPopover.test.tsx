import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CalendarEvent } from '@/types/calendar';
import { DayOverflowPopover } from '../DayOverflowPopover';

const events: CalendarEvent[] = Array.from({ length: 5 }, (_, i) => ({
  executionId: i + 1,
  requestId: 100 + i,
  requestTitle: `Job ${i + 1}`,
  categoryName: 'Lavoura',
  scheduledDate: '2026-05-17',
  scheduledEndDate: '2026-05-17',
  scheduledStartTime: `0${8 + i}:00`,
  scheduledEndTime: `1${i}:00`,
  scheduledAllDay: false,
  urgency: 'MEDIUM',
  status: 'AWARDED',
  island: 'Terceira',
  parish: 'Sé',
  assignments: [],
}));

describe('DayOverflowPopover', () => {
  it('lists every event', () => {
    render(
      <DayOverflowPopover
        dayIso="2026-05-17"
        events={events}
        conflictSet={new Set()}
        onClose={() => {}}
      />,
    );
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Job ${i}`)).toBeInTheDocument();
    }
  });

  it('shows formatted date heading', () => {
    render(
      <DayOverflowPopover
        dayIso="2026-05-17"
        events={events}
        conflictSet={new Set()}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/17/)).toBeInTheDocument();
  });

  it('calls onClose on backdrop click', () => {
    const onClose = vi.fn();
    render(
      <DayOverflowPopover
        dayIso="2026-05-17"
        events={events}
        conflictSet={new Set()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId('overflow-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <DayOverflowPopover
        dayIso="2026-05-17"
        events={events}
        conflictSet={new Set()}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('exposes dialog semantics for assistive tech', () => {
    render(
      <DayOverflowPopover
        dayIso="2026-05-17"
        events={events}
        conflictSet={new Set()}
        onClose={() => {}}
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('uses singular "trabalho" when there is only one event', () => {
    render(
      <DayOverflowPopover
        dayIso="2026-05-17"
        events={[events[0]]}
        conflictSet={new Set()}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('1 trabalho')).toBeInTheDocument();
  });

  it('uses plural "trabalhos" when there are multiple events', () => {
    render(
      <DayOverflowPopover
        dayIso="2026-05-17"
        events={events}
        conflictSet={new Set()}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('5 trabalhos')).toBeInTheDocument();
  });
});
