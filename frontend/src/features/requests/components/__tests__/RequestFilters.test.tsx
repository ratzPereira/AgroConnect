import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequestFilters, type FilterState } from '../RequestFilters';

const defaultFilters: FilterState = {
  search: '',
  urgency: '',
  island: '',
};

describe('RequestFilters', () => {
  it('renders search input and filter button', () => {
    render(<RequestFilters filters={defaultFilters} onFilterChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Pesquisar pedidos...')).toBeInTheDocument();
    // Filter button (contains "Filtros" text on desktop)
    expect(screen.getByText('Filtros')).toBeInTheDocument();
  });

  it('expands filter panel when filter button clicked', () => {
    render(<RequestFilters filters={defaultFilters} onFilterChange={vi.fn()} />);
    // Initially, urgency and island selects should not be visible
    expect(screen.queryByText('Urgência')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Filtros'));

    expect(screen.getByText('Urgência')).toBeInTheDocument();
    expect(screen.getByText('Ilha')).toBeInTheDocument();
  });

  it('calls onFilterChange when urgency select changes', () => {
    const onFilterChange = vi.fn();
    render(<RequestFilters filters={defaultFilters} onFilterChange={onFilterChange} />);

    // Expand filters
    fireEvent.click(screen.getByText('Filtros'));

    // Both selects show "Todas" - urgency is the first
    const selects = screen.getAllByDisplayValue('Todas');
    fireEvent.change(selects[0], { target: { value: 'HIGH' } });

    expect(onFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      urgency: 'HIGH',
    });
  });

  it('calls onFilterChange when island select changes', () => {
    const onFilterChange = vi.fn();
    render(<RequestFilters filters={defaultFilters} onFilterChange={onFilterChange} />);

    fireEvent.click(screen.getByText('Filtros'));

    // Both selects show "Todas" -- island is the second
    const selects = screen.getAllByDisplayValue('Todas');
    fireEvent.change(selects[1], { target: { value: 'Terceira' } });

    expect(onFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      island: 'Terceira',
    });
  });

  it('shows clear button when filters are active', () => {
    const activeFilters: FilterState = {
      search: 'lavoura',
      urgency: '',
      island: '',
    };
    const { container } = render(
      <RequestFilters filters={activeFilters} onFilterChange={vi.fn()} />,
    );
    // Clear button renders an X icon button
    const buttons = container.querySelectorAll('button');
    // Should have filter button + clear button
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('does not show clear button when no filters active', () => {
    render(<RequestFilters filters={defaultFilters} onFilterChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    // Only the filter toggle button
    expect(buttons.length).toBe(1);
  });

  it('renders urgency options in Portuguese', () => {
    render(<RequestFilters filters={defaultFilters} onFilterChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Filtros'));
    expect(screen.getByText('Baixa')).toBeInTheDocument();
    expect(screen.getByText('Média')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });

  it('renders Azores islands in island dropdown', () => {
    render(<RequestFilters filters={defaultFilters} onFilterChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Filtros'));
    expect(screen.getByText('São Miguel')).toBeInTheDocument();
    expect(screen.getByText('Terceira')).toBeInTheDocument();
    expect(screen.getByText('Faial')).toBeInTheDocument();
  });
});
