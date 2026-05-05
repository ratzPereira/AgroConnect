import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GanttSidebar } from '../GanttSidebar';
import type { GanttRow } from '@/types/calendar';

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
  {
    id: 'job-2',
    label: 'Limpeza de mato',
    sublabel: 'Limpeza',
    bars: [
      {
        executionId: 2,
        requestId: 11,
        requestTitle: 'Limpeza de mato',
        categoryName: 'Limpeza',
        startDate: '2026-03-15',
        endDate: '2026-03-16',
        urgency: 'HIGH',
        status: 'AWARDED',
        island: 'Terceira',
        parish: 'São Sebastião',
      },
    ],
  },
];

describe('GanttSidebar', () => {
  it('renders resource names (row labels)', () => {
    render(<GanttSidebar rows={mockRows} />);
    expect(screen.getByText('Lavoura de terreno')).toBeInTheDocument();
    expect(screen.getByText('Limpeza de mato')).toBeInTheDocument();
  });

  it('renders sublabels', () => {
    render(<GanttSidebar rows={mockRows} />);
    expect(screen.getByText('Preparação de Solo')).toBeInTheDocument();
    expect(screen.getByText('Limpeza')).toBeInTheDocument();
  });

  it('renders header label', () => {
    render(<GanttSidebar rows={mockRows} />);
    expect(screen.getByText('Recurso')).toBeInTheDocument();
  });

  it('renders empty spacer when no rows', () => {
    const { container } = render(<GanttSidebar rows={[]} />);
    // Should still render the header but have an empty spacer div
    expect(screen.getByText('Recurso')).toBeInTheDocument();
    expect(container.querySelector('.h-\\[100px\\]')).not.toBeNull();
  });
});
