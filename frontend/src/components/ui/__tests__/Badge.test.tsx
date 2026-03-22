import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge.className).toContain('bg-primary-50');
    expect(badge.className).toContain('text-primary-700');
  });

  it('applies success variant classes', () => {
    render(<Badge variant="success">OK</Badge>);
    const badge = screen.getByText('OK');
    expect(badge.className).toContain('leaf');
  });

  it('applies danger variant classes', () => {
    render(<Badge variant="danger">Error</Badge>);
    const badge = screen.getByText('Error');
    expect(badge.className).toContain('danger');
  });

  it('applies warning variant classes', () => {
    render(<Badge variant="warning">Caution</Badge>);
    const badge = screen.getByText('Caution');
    expect(badge.className).toContain('warning');
  });

  it('applies neutral variant classes', () => {
    render(<Badge variant="neutral">Neutral</Badge>);
    const badge = screen.getByText('Neutral');
    expect(badge.className).toContain('bg-neutral-100');
  });

  it('renders with dot indicator when dot prop is set', () => {
    render(<Badge dot>Status</Badge>);
    const badge = screen.getByText('Status');
    const dot = badge.querySelector('span.rounded-full');
    expect(dot).toBeTruthy();
  });

  it('does not render dot when dot prop is not set', () => {
    render(<Badge>No Dot</Badge>);
    const badge = screen.getByText('No Dot');
    const dot = badge.querySelector('span.rounded-full');
    expect(dot).toBeNull();
  });

  it('applies size classes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small').className).toContain('text-[11px]');

    rerender(<Badge size="md">Medium</Badge>);
    expect(screen.getByText('Medium').className).toContain('text-xs');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Test</Badge>);
    expect(screen.getByText('Test').className).toContain('custom-class');
  });

  it('renders as inline-flex span with rounded-full border', () => {
    render(<Badge>Shape</Badge>);
    const badge = screen.getByText('Shape');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toContain('inline-flex');
    expect(badge.className).toContain('rounded-full');
    expect(badge.className).toContain('border');
  });
});
