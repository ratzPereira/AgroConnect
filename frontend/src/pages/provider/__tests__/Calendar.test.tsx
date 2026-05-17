import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { CalendarEvent } from '@/types/calendar';

const { calendarEventsMock } = vi.hoisted(() => ({
  calendarEventsMock: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/api/calendar', () => ({
  getCalendarEvents: (...args: unknown[]) => calendarEventsMock(...args),
  getConflicts: vi.fn().mockResolvedValue([]),
  getCalendarSummary: vi.fn().mockResolvedValue({
    totalExecutions: 0,
    completed: 0,
    inProgress: 0,
    scheduled: 0,
    overdue: 0,
    revenue: 0,
  }),
  getWorkloadHeatmap: vi.fn().mockResolvedValue({ operators: [], machines: [] }),
  getMaintenanceWindows: vi.fn().mockResolvedValue([]),
  getCalendarAlerts: vi.fn().mockResolvedValue({
    conflicts: [],
    maintenance: [],
    payments: [],
    proposals: [],
  }),
  updateSchedule: vi.fn(),
  reassignExecution: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { ProviderCalendar } from '../Calendar';

function wrap(ui: ReactNode, search = '') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const initial = search ? `/${search.startsWith('?') ? search : `?${search}`}` : '/';
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={ui} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('ProviderCalendar (page)', () => {
  it('renders the page title and subtitle', () => {
    wrap(<ProviderCalendar />);
    expect(screen.getByText('Calendário')).toBeInTheDocument();
    expect(
      screen.getByText('Plano operacional dos seus trabalhos, equipa e máquinas.'),
    ).toBeInTheDocument();
  });

  it('renders header controls (view, lane, filters)', () => {
    wrap(<ProviderCalendar />);
    expect(screen.getByText('Calendário')).toBeInTheDocument();
  });

  it('opens the event popover when a month chip is clicked', async () => {
    const event: CalendarEvent = {
      executionId: 7001,
      requestId: 9001,
      requestTitle: 'Lavoura Cisne',
      categoryName: 'Preparação de Solo',
      scheduledDate: '2026-05-15',
      scheduledEndDate: '2026-05-15',
      scheduledStartTime: '09:00',
      scheduledEndTime: '12:00',
      scheduledAllDay: false,
      status: 'IN_PROGRESS',
      island: 'Terceira',
      parish: 'Angra do Heroísmo',
      urgency: 'MEDIUM',
      assignments: [
        { teamMemberId: 1, teamMemberName: 'João Silva', machineId: null, machineName: null },
      ],
    };
    calendarEventsMock.mockResolvedValue([event]);

    wrap(<ProviderCalendar />, '?view=month&date=2026-05-15');

    // Scope to the desktop month grid to disambiguate from the mobile agenda
    // and the SideRail "next up" item which both also render the title.
    const cellBodies = await screen.findAllByTestId('cell-body');
    const monthChip = cellBodies
      .flatMap((body) => Array.from(within(body).queryAllByRole('button')))
      .find((btn) => btn.textContent?.includes('Lavoura Cisne'));
    if (!monthChip) throw new Error('Month chip not found');
    fireEvent.click(monthChip);

    const dialog = await screen.findByRole('dialog', {
      name: /Detalhes: Lavoura Cisne/i,
    });
    expect(dialog).toBeInTheDocument();
  });
});
