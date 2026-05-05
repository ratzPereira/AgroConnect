import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';

describe('Avatar', () => {
  it('renders initials from single name', () => {
    render(<Avatar name="Maria" />);
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('renders initials from full name (first + last)', () => {
    render(<Avatar name="Maria Santos" />);
    expect(screen.getByText('MS')).toBeInTheDocument();
  });

  it('renders initials from multi-word name (first + last)', () => {
    render(<Avatar name="Ana Maria Ferreira Santos" />);
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('renders question mark when no name provided', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    render(<Avatar src="https://example.com/photo.jpg" alt="User photo" name="Maria" />);
    const img = screen.getByAltText('User photo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('applies size variant classes', () => {
    const { container, rerender } = render(<Avatar name="A" size="xs" />);
    const inner = container.querySelector('.rounded-full') as HTMLElement;
    expect(inner.className).toContain('h-6');
    expect(inner.className).toContain('w-6');

    rerender(<Avatar name="A" size="xl" />);
    const innerXl = container.querySelector('.rounded-full') as HTMLElement;
    expect(innerXl.className).toContain('h-16');
    expect(innerXl.className).toContain('w-16');
  });

  it('applies medium size by default', () => {
    const { container } = render(<Avatar name="Test" />);
    const inner = container.querySelector('.rounded-full') as HTMLElement;
    expect(inner.className).toContain('h-10');
    expect(inner.className).toContain('w-10');
  });
});
