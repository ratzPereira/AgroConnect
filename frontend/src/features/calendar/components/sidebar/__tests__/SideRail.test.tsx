import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { CalendarAlerts, CalendarEvent } from '@/types/calendar';
import { SideRail } from '../SideRail';

const baseEvent: CalendarEvent = {
  executionId: 1,
  requestId: 11,
  requestTitle: 'Lavoura',
  categoryName: 'Solo',
  scheduledDate: '2026-04-20',
  scheduledEndDate: '2026-04-20',
  scheduledStartTime: '09:00',
  scheduledEndTime: '12:00',
  scheduledAllDay: false,
  status: 'IN_PROGRESS',
  island: 'Terceira',
  parish: 'Angra',
  urgency: 'MEDIUM',
  assignments: [],
};

const emptyAlerts: CalendarAlerts = { conflicts: [], maintenance: [], payments: [], proposals: [] };

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('SideRail', () => {
  it('shows empty alert message when no alerts', () => {
    wrap(<SideRail alerts={emptyAlerts} events={[]} isLoading={false} anchorIso="2026-04-15" />);
    expect(screen.getByText(/Sem alertas/)).toBeInTheDocument();
  });

  it('renders maintenance alert items', () => {
    const alerts: CalendarAlerts = {
      ...emptyAlerts,
      maintenance: [
        { maintenanceLogId: 1, machineId: 7, machineName: 'Trator XL', dueDate: '2026-04-12', description: 'Óleo' },
      ],
    };
    wrap(<SideRail alerts={alerts} events={[]} isLoading={false} anchorIso="2026-04-15" />);
    expect(screen.getByText(/Manutenção em atraso · Trator XL/)).toBeInTheDocument();
  });

  it('renders upcoming jobs sorted by date', () => {
    wrap(<SideRail alerts={emptyAlerts} events={[baseEvent]} isLoading={false} anchorIso="2026-04-15" />);
    expect(screen.getByText('Lavoura')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    const { container } = wrap(<SideRail alerts={undefined} events={[]} isLoading anchorIso="2026-04-15" />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
