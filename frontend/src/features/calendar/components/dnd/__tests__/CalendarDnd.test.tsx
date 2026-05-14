import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { CalendarEvent } from '@/types/calendar';
import { CalendarDnd } from '../CalendarDnd';

vi.mock('@/api/calendar', () => ({
  getCalendarEvents: vi.fn(),
  getConflicts: vi.fn(),
  updateSchedule: vi.fn(),
  reassignExecution: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrap(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

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
  assignments: [{ teamMemberId: 1, teamMemberName: 'João', machineId: null, machineName: null }],
};

describe('CalendarDnd', () => {
  it('renders children when no drag in progress', () => {
    wrap(
      <CalendarDnd events={[event]}>
        <div data-testid="inner">child content</div>
      </CalendarDnd>,
    );
    expect(screen.getByTestId('inner')).toBeInTheDocument();
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('renders with empty event list', () => {
    wrap(
      <CalendarDnd events={[]}>
        <div>empty wrapper</div>
      </CalendarDnd>,
    );
    expect(screen.getByText('empty wrapper')).toBeInTheDocument();
  });

  it('does not show drag overlay when no drag session is active', () => {
    wrap(
      <CalendarDnd events={[event]}>
        <div>idle</div>
      </CalendarDnd>,
    );
    expect(screen.queryByText('Lavoura A')).not.toBeInTheDocument();
  });
});
