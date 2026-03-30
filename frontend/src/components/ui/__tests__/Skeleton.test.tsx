import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders with default shimmer styling', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('animate-shimmer');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-8 w-32" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('h-8');
    expect(el.className).toContain('w-32');
    expect(el.className).toContain('animate-shimmer');
  });

  it('renders Line sub-component', () => {
    const { container } = render(<Skeleton.Line />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('h-4');
    expect(el.className).toContain('w-full');
  });

  it('renders Circle sub-component', () => {
    const { container } = render(<Skeleton.Circle />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('rounded-full');
  });

  it('renders Rect sub-component', () => {
    const { container } = render(<Skeleton.Rect />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('h-24');
    expect(el.className).toContain('rounded-lg');
  });

  it('renders Card sub-component with multiple skeleton parts', () => {
    const { container } = render(<Skeleton.Card />);
    const skeletons = container.querySelectorAll('.animate-shimmer');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders Table sub-component with rows', () => {
    const { container } = render(<Skeleton.Table />);
    const skeletons = container.querySelectorAll('.animate-shimmer');
    expect(skeletons.length).toBeGreaterThan(5);
  });
});
