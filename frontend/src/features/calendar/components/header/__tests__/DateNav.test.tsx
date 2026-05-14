import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateNav } from '../DateNav';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 4, 20));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DateNav', () => {
  it('renders day-view label using long Portuguese date', () => {
    render(<DateNav view="day" anchor="2026-05-20" onChange={vi.fn()} />);
    expect(screen.getByText(/maio/i)).toBeInTheDocument();
  });

  it('renders week-view label prefixed by "Semana de"', () => {
    render(<DateNav view="week" anchor="2026-05-18" onChange={vi.fn()} />);
    expect(screen.getByText(/Semana de/)).toBeInTheDocument();
  });

  it('renders month-view label as "MonthName YYYY"', () => {
    render(<DateNav view="month" anchor="2026-05-15" onChange={vi.fn()} />);
    expect(screen.getByText('Maio 2026')).toBeInTheDocument();
  });

  it('hides "Hoje" button when anchor equals today', () => {
    render(<DateNav view="day" anchor="2026-05-20" onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Hoje' })).not.toBeInTheDocument();
  });

  it('shows "Hoje" button when anchor differs from today and resets on click', () => {
    const onChange = vi.fn();
    render(<DateNav view="day" anchor="2026-05-15" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));
    expect(onChange).toHaveBeenCalledWith('2026-05-20');
  });

  it('shifts by one day in day view', () => {
    const onChange = vi.fn();
    render(<DateNav view="day" anchor="2026-05-20" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(onChange).toHaveBeenCalledWith('2026-05-19');
    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }));
    expect(onChange).toHaveBeenCalledWith('2026-05-21');
  });

  it('shifts by seven days in week view', () => {
    const onChange = vi.fn();
    render(<DateNav view="week" anchor="2026-05-20" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }));
    expect(onChange).toHaveBeenCalledWith('2026-05-27');
  });

  it('shifts by one month in month view', () => {
    const onChange = vi.fn();
    render(<DateNav view="month" anchor="2026-05-15" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }));
    expect(onChange).toHaveBeenCalledWith('2026-06-01');
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(onChange).toHaveBeenCalledWith('2026-04-01');
  });
});
