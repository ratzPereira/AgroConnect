import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="Sem dados" />);
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
  });

  it('renders title as h3 heading', () => {
    render(<EmptyState title="Sem resultados" />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Sem resultados');
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="Nothing to show here" />);
    expect(screen.getByText('Nothing to show here')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(0);
  });

  it('renders action button when provided', () => {
    render(<EmptyState title="Empty" action={<button>Create</button>} />);
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('does not render action slot when not provided', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders illustration when provided', () => {
    render(
      <EmptyState
        title="No items"
        illustration={<img src="/test.svg" alt="illustration" />}
      />,
    );
    expect(screen.getByAltText('illustration')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState title="Test" className="extra-class" />,
    );
    expect(container.firstElementChild?.className).toContain('extra-class');
  });

  it('applies animate-fade-in class', () => {
    const { container } = render(<EmptyState title="Animated" />);
    expect(container.firstElementChild?.className).toContain('animate-fade-in');
  });
});
