import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { CalendarAlerts, CalendarEvent } from '@/types/calendar';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

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

  it('renders conflict alerts with overlapping count and resource name', () => {
    const alerts: CalendarAlerts = {
      ...emptyAlerts,
      conflicts: [
        { date: '2026-04-16', resourceType: 'TEAM_MEMBER', resourceId: 5, resourceName: 'João', overlappingCount: 3 },
      ],
    };
    wrap(<SideRail alerts={alerts} events={[]} isLoading={false} anchorIso="2026-04-15" />);
    expect(screen.getByText(/3 sobreposições · João/)).toBeInTheDocument();
  });

  it('renders payment alerts as warning items', () => {
    const alerts: CalendarAlerts = {
      ...emptyAlerts,
      payments: [
        { executionId: 11, requestTitle: 'Pulverização', completedOn: '2026-04-10', daysAwaiting: 4 },
      ],
    };
    wrap(<SideRail alerts={alerts} events={[]} isLoading={false} anchorIso="2026-04-15" />);
    expect(screen.getByText(/4d à espera de confirmação/)).toBeInTheDocument();
    expect(screen.getByText('Pulverização')).toBeInTheDocument();
  });

  it('renders proposal alerts and navigates to the request on click', () => {
    navigateMock.mockReset();
    const alerts: CalendarAlerts = {
      ...emptyAlerts,
      proposals: [
        { requestId: 77, requestTitle: 'Adubação', competingProposals: 2, submittedOn: '2026-04-12' },
      ],
    };
    wrap(<SideRail alerts={alerts} events={[]} isLoading={false} anchorIso="2026-04-15" />);
    fireEvent.click(screen.getByRole('button', { name: /2 propostas concorrentes/ }));
    expect(navigateMock).toHaveBeenCalledWith('/provider/requests/77');
  });

  it('navigates to machine page when maintenance alert is clicked', () => {
    navigateMock.mockReset();
    const alerts: CalendarAlerts = {
      ...emptyAlerts,
      maintenance: [
        { maintenanceLogId: 1, machineId: 7, machineName: 'Trator XL', dueDate: '2026-04-12', description: 'Óleo' },
      ],
    };
    wrap(<SideRail alerts={alerts} events={[]} isLoading={false} anchorIso="2026-04-15" />);
    fireEvent.click(screen.getByRole('button', { name: /Trator XL/ }));
    expect(navigateMock).toHaveBeenCalledWith('/provider/machines/7');
  });

  it('shows empty upcoming-jobs message when no events to show', () => {
    wrap(<SideRail alerts={emptyAlerts} events={[]} isLoading={false} anchorIso="2026-04-15" />);
    expect(screen.getByText(/Sem trabalhos agendados a seguir/)).toBeInTheDocument();
  });

  it('navigates to the job page when upcoming job button is clicked', () => {
    navigateMock.mockReset();
    wrap(<SideRail alerts={emptyAlerts} events={[baseEvent]} isLoading={false} anchorIso="2026-04-15" />);
    fireEvent.click(screen.getByRole('button', { name: /Lavoura/ }));
    expect(navigateMock).toHaveBeenCalledWith('/provider/jobs/11');
  });

  it('filters out events before the anchor date', () => {
    const past = { ...baseEvent, executionId: 99, requestTitle: 'Passado', scheduledDate: '2026-04-10' };
    wrap(<SideRail alerts={emptyAlerts} events={[past, baseEvent]} isLoading={false} anchorIso="2026-04-15" />);
    expect(screen.queryByText('Passado')).not.toBeInTheDocument();
    expect(screen.getByText('Lavoura')).toBeInTheDocument();
  });

  it('renders all-day events using formatDate (no time)', () => {
    const allDay = { ...baseEvent, scheduledAllDay: true, scheduledStartTime: null, scheduledEndTime: null };
    wrap(<SideRail alerts={emptyAlerts} events={[allDay]} isLoading={false} anchorIso="2026-04-15" />);
    expect(screen.getByText('Lavoura')).toBeInTheDocument();
  });
});
