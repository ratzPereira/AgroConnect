import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { WorkloadHeatmap as WorkloadHeatmapData } from '@/types/calendar';
import { WorkloadHeatmap } from '../WorkloadHeatmap';

const sample: WorkloadHeatmapData = {
  from: '2026-04-13',
  to: '2026-04-17',
  operators: [
    {
      teamMemberId: 1,
      teamMemberName: 'João Silva',
      role: 'OPERATOR',
      minutesByDate: { '2026-04-13': 420, '2026-04-14': 900, '2026-04-15': 0 },
      totalMinutes: 1320,
    },
    {
      teamMemberId: 2,
      teamMemberName: 'Ana Costa',
      role: 'LEAD',
      minutesByDate: { '2026-04-13': 120 },
      totalMinutes: 120,
    },
  ],
};

describe('WorkloadHeatmap', () => {
  it('renders rows per operator and total hours', () => {
    render(<WorkloadHeatmap data={sample} isLoading={false} />);
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    expect(screen.getByText('22.0h')).toBeInTheDocument();
  });

  it('renders empty state when no operators', () => {
    render(<WorkloadHeatmap data={{ from: '', to: '', operators: [] }} isLoading={false} />);
    expect(screen.getByText(/Sem dados de carga/)).toBeInTheDocument();
  });

  it('fires onCellClick with the iso date', () => {
    const onCellClick = vi.fn();
    render(<WorkloadHeatmap data={sample} isLoading={false} onCellClick={onCellClick} />);
    const overloaded = screen.getByTitle(/João Silva · 2026-04-14/);
    fireEvent.click(overloaded);
    expect(onCellClick).toHaveBeenCalledWith('2026-04-14');
  });

  it('renders skeleton while loading', () => {
    const { container } = render(<WorkloadHeatmap data={undefined} isLoading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
