import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CalendarSummary } from '@/types/calendar';
import { KpiStrip } from '../KpiStrip';

const sample: CalendarSummary = {
  totalEvents: 42,
  inProgress: 7,
  awaitingConfirmation: 3,
  completed: 25,
  conflicting: 2,
  totalRevenue: 12500,
  activeOperators: 5,
  activeMachines: 4,
  operatorUtilization: 0.72,
};

describe('KpiStrip', () => {
  it('renders all 8 tiles with formatted values', () => {
    render(<KpiStrip summary={sample} isLoading={false} />);
    expect(screen.getByText('Trabalhos no período')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(/72%/)).toBeInTheDocument();
  });

  it('renders loading placeholders when no summary yet', () => {
    const { container } = render(<KpiStrip summary={undefined} isLoading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBe(8);
  });

  it('renders empty when summary is undefined and not loading', () => {
    const { container } = render(<KpiStrip summary={undefined} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });
});
