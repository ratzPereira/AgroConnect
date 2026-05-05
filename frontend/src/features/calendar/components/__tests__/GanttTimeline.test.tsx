import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GanttTimeline } from '../GanttTimeline';
import type { GanttRow } from '@/types/calendar';

vi.mock('../GanttBar', () => ({
  GanttBarComponent: ({ bar }: { bar: { requestTitle: string } }) => (
    <div data-testid="gantt-bar">{bar.requestTitle}</div>
  ),
}));

const mockRows: GanttRow[] = [
  {
    id: 'job-1',
    label: 'Lavoura de terreno',
    sublabel: 'Preparação de Solo',
    bars: [
      {
        executionId: 1,
        requestId: 10,
        requestTitle: 'Lavoura de terreno',
        categoryName: 'Preparação de Solo',
        startDate: '2026-03-10',
        endDate: '2026-03-12',
        urgency: 'MEDIUM',
        status: 'IN_PROGRESS',
        island: 'Terceira',
        parish: 'Angra do Heroísmo',
      },
    ],
  },
];

describe('GanttTimeline', () => {
  function renderTimeline(rows = mockRows) {
    return render(
      <MemoryRouter>
        <GanttTimeline rows={rows} year={2026} month={2} />
      </MemoryRouter>,
    );
  }

  it('renders timeline with date labels for the month', () => {
    renderTimeline();
    // March 2026 has 31 days, check some date numbers
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
  });

  it('renders weekday header labels', () => {
    renderTimeline();
    // Check that weekday abbreviations are shown (D, S, T, Q)
    const allElements = screen.getAllByText('S');
    expect(allElements.length).toBeGreaterThan(0);
  });

  it('renders gantt bars for rows', () => {
    renderTimeline();
    expect(screen.getByTestId('gantt-bar')).toBeInTheDocument();
    expect(screen.getByText('Lavoura de terreno')).toBeInTheDocument();
  });

  it('shows empty state message when no rows', () => {
    renderTimeline([]);
    expect(screen.getByText('Sem trabalhos agendados neste mês')).toBeInTheDocument();
  });
});
