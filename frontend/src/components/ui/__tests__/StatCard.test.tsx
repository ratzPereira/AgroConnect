import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { StatCard } from '../StatCard';

// Mock recharts to avoid rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
}));

// Mock useAnimatedCounter to return the target value immediately
vi.mock('@/hooks/useAnimatedCounter', () => ({
  useAnimatedCounter: (value: number) => value,
}));

describe('StatCard', () => {
  it('renders label', () => {
    render(<StatCard label="Total" value={100} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders formatted value with pt-PT locale', () => {
    render(<StatCard label="Count" value={1234} />);
    // pt-PT locale uses non-breaking space or period as thousands separator
    const valueEl = screen.getByText((_content, element) => {
      return element?.tagName === 'P' && (element.textContent?.includes('1') ?? false) && (element.textContent?.includes('234') ?? false);
    });
    expect(valueEl).toBeInTheDocument();
  });

  it('renders prefix and suffix', () => {
    const { container } = render(<StatCard label="Revenue" value={500} prefix="$" suffix="/mo" />);
    const valueP = container.querySelector('.text-\\[32px\\]');
    expect(valueP).toBeTruthy();
    expect(valueP?.textContent).toContain('$');
    expect(valueP?.textContent).toContain('500');
    expect(valueP?.textContent).toContain('/mo');
  });

  it('renders positive trend indicator', () => {
    render(<StatCard label="Growth" value={100} trend={15} />);
    expect(screen.getByText('15%')).toBeInTheDocument();
  });

  it('renders negative trend indicator', () => {
    render(<StatCard label="Decline" value={100} trend={-5} />);
    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  it('does not render trend when trend is 0', () => {
    render(<StatCard label="Stable" value={100} trend={0} />);
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('does not render trend when not provided', () => {
    const { container } = render(<StatCard label="No Trend" value={50} />);
    // No trending icon should be present
    expect(container.querySelector('.text-leaf-600')).toBeNull();
    expect(container.querySelector('.text-danger-600')).toBeNull();
  });

  it('renders icon when provided', () => {
    render(
      <StatCard
        label="Test"
        value={42}
        icon={<span data-testid="icon">IC</span>}
      />,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatCard label="Custom" value={10} className="my-custom-class" />,
    );
    expect(container.firstElementChild?.className).toContain('my-custom-class');
  });
});
