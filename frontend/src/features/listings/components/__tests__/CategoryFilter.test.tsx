import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryFilter } from '../CategoryFilter';

describe('CategoryFilter', () => {
  it('renders all category buttons including "Todos"', () => {
    render(<CategoryFilter selected={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Animais')).toBeInTheDocument();
    expect(screen.getByText('Plantas')).toBeInTheDocument();
    expect(screen.getByText('Sementes')).toBeInTheDocument();
    expect(screen.getByText('Produção')).toBeInTheDocument();
    expect(screen.getByText('Equipamento')).toBeInTheDocument();
  });

  it('highlights selected "Todos" category with active styling', () => {
    render(<CategoryFilter selected={null} onSelect={vi.fn()} />);
    const todosButton = screen.getByText('Todos').closest('button') as HTMLElement;
    expect(todosButton.className).toContain('bg-neutral-800');
    expect(todosButton.className).toContain('text-white');
  });

  it('highlights selected ANIMALS category with amber styling', () => {
    render(<CategoryFilter selected="ANIMALS" onSelect={vi.fn()} />);
    const animaisButton = screen.getByText('Animais').closest('button') as HTMLElement;
    expect(animaisButton.className).toContain('bg-amber-600');
    expect(animaisButton.className).toContain('text-white');

    // "Todos" should not be active
    const todosButton = screen.getByText('Todos').closest('button') as HTMLElement;
    expect(todosButton.className).not.toContain('bg-neutral-800');
    expect(todosButton.className).toContain('bg-white');
  });

  it('calls onSelect with null when "Todos" is clicked', () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selected="ANIMALS" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Todos'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('calls onSelect with category value when category button clicked', () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Plantas'));
    expect(onSelect).toHaveBeenCalledWith('PLANTS');
  });

  it('calls onSelect with EQUIPMENT when "Equipamento" clicked', () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Equipamento'));
    expect(onSelect).toHaveBeenCalledWith('EQUIPMENT');
  });

  it('applies inactive styling to non-selected categories', () => {
    render(<CategoryFilter selected="PLANTS" onSelect={vi.fn()} />);
    const animaisButton = screen.getByText('Animais').closest('button') as HTMLElement;
    expect(animaisButton.className).toContain('bg-white');
    expect(animaisButton.className).toContain('text-neutral-600');
  });
});
