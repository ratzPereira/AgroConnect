import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Avatar, AvatarGroup } from '../Avatar';

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

  it('falls back to initials when image fails to load', () => {
    render(<Avatar src="https://example.com/broken.jpg" name="Maria Santos" />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.getByText('MS')).toBeInTheDocument();
  });

  it('renders status dot with online color when status="online"', () => {
    const { container } = render(<Avatar name="A" status="online" />);
    const dot = container.querySelector('.bg-leaf-500');
    expect(dot).toBeInTheDocument();
  });

  it('renders status dot with busy color when status="busy"', () => {
    const { container } = render(<Avatar name="A" status="busy" />);
    expect(container.querySelector('.bg-warning-400')).toBeInTheDocument();
  });

  it('uses alt fallback when name is provided but alt is not', () => {
    render(<Avatar src="https://example.com/photo.jpg" name="Joao" />);
    expect(screen.getByAltText('Joao')).toBeInTheDocument();
  });
});

describe('AvatarGroup', () => {
  it('renders all children when no max is set', () => {
    render(
      <AvatarGroup>
        <Avatar name="Ana" />
        <Avatar name="Bia" />
        <Avatar name="Caio" />
      </AvatarGroup>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('shows overflow indicator when avatars exceed max', () => {
    render(
      <AvatarGroup max={2}>
        <Avatar name="Ana" />
        <Avatar name="Bia" />
        <Avatar name="Caio" />
        <Avatar name="Duda" />
      </AvatarGroup>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('C')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not show overflow indicator when count is exactly max', () => {
    render(
      <AvatarGroup max={2}>
        <Avatar name="Ana" />
        <Avatar name="Bia" />
      </AvatarGroup>,
    );
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });
});
