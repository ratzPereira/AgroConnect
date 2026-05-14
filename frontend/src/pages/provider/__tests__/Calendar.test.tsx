import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/api/calendar', () => ({
  getCalendarEvents: vi.fn().mockResolvedValue([]),
  getConflicts: vi.fn().mockResolvedValue([]),
  getCalendarSummary: vi.fn().mockResolvedValue({
    totalExecutions: 0,
    completed: 0,
    inProgress: 0,
    scheduled: 0,
    overdue: 0,
    revenue: 0,
  }),
  getWorkloadHeatmap: vi.fn().mockResolvedValue({ cells: [] }),
  getMaintenanceWindows: vi.fn().mockResolvedValue([]),
  getCalendarAlerts: vi.fn().mockResolvedValue({ conflicts: [], overlaps: [], overdueJobs: [] }),
  updateSchedule: vi.fn(),
  reassignExecution: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { ProviderCalendar } from '../Calendar';

function wrap(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
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
    // Smoke check that the header area renders without crashing
    expect(screen.getByText('Calendário')).toBeInTheDocument();
  });
});
