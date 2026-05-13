import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DndContext } from '@dnd-kit/core';
import type { CalendarEvent, ConflictResponse } from '@/types/calendar';
import { DayView } from '../DayView';

const timedEvent: CalendarEvent = {
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

const allDayEvent: CalendarEvent = {
  ...timedEvent,
  executionId: 2,
  requestTitle: 'Limpeza pastagem',
  scheduledStartTime: null,
  scheduledEndTime: null,
  scheduledAllDay: true,
};

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('DayView', () => {
  it('renders timed events in operator lanes', () => {
    wrap(<DayView events={[timedEvent]} conflicts={[]} dayIso="2026-04-15" lane="operators" />);
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Lavoura A')).toBeInTheDocument();
  });

  it('places all-day events in the band, not the lanes', () => {
    wrap(<DayView events={[allDayEvent]} conflicts={[]} dayIso="2026-04-15" lane="operators" />);
    expect(screen.getByText('Limpeza pastagem')).toBeInTheDocument();
  });

  it('renders empty state when no events', () => {
    wrap(<DayView events={[]} conflicts={[]} dayIso="2026-04-15" lane="operators" />);
    expect(screen.getByText(/Sem eventos para este dia/)).toBeInTheDocument();
  });

  it('marks conflicting events with conflict ring', () => {
    const conflict: ConflictResponse = {
      date: '2026-04-15',
      resourceType: 'TEAM_MEMBER',
      resourceId: 1,
      resourceName: 'João',
      conflictingEvents: [{ executionId: 1, requestTitle: 'Lavoura A' }],
    };
    const { container } = wrap(
      <DayView events={[timedEvent]} conflicts={[conflict]} dayIso="2026-04-15" lane="operators" />,
    );
    const bar = container.querySelector('[data-execution-id="1"]');
    expect(bar?.className).toMatch(/ring-danger/);
  });

  it('renders draggable bars inside a DndContext when enableDnd is true', () => {
    const { container } = wrap(
      <DndContext>
        <DayView
          events={[timedEvent]}
          conflicts={[]}
          dayIso="2026-04-15"
          lane="operators"
          enableDnd
        />
      </DndContext>,
    );
    expect(container.querySelector('[data-lane-id="op-1"]')).toBeTruthy();
    expect(container.querySelector('[data-execution-id="1"]')).toBeTruthy();
  });

  it('forwards click to onEventClick', () => {
    const onEventClick = vi.fn();
    wrap(
      <DayView
        events={[timedEvent]}
        conflicts={[]}
        dayIso="2026-04-15"
        lane="operators"
        onEventClick={onEventClick}
      />,
    );
    screen.getByText('Lavoura A').closest('[role="button"]')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(onEventClick).toHaveBeenCalledOnce();
  });
});
