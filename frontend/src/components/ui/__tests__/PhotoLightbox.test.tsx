import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoLightbox } from '../PhotoLightbox';

const photos = [
  'https://example.com/photo1.jpg',
  'https://example.com/photo2.jpg',
  'https://example.com/photo3.jpg',
];

describe('PhotoLightbox', () => {
  it('renders the current photo', () => {
    render(
      <PhotoLightbox
        photos={photos}
        currentIndex={0}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );
    const img = screen.getByAltText('Foto 1 de 3');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', photos[0]);
  });

  it('shows photo counter', () => {
    render(
      <PhotoLightbox
        photos={photos}
        currentIndex={1}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <PhotoLightbox
        photos={photos}
        currentIndex={0}
        onClose={onClose}
        onNavigate={vi.fn()}
      />,
    );
    // The backdrop is the outermost fixed div
    const backdrop = screen.getByAltText('Foto 1 de 3').closest('.fixed') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(
      <PhotoLightbox
        photos={photos}
        currentIndex={0}
        onClose={onClose}
        onNavigate={vi.fn()}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not show previous button on first photo', () => {
    const { container } = render(
      <PhotoLightbox
        photos={photos}
        currentIndex={0}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );
    // Previous button is on the left side, only shown when hasPrev
    const buttons = container.querySelectorAll('button');
    // Only the close button and next button should exist
    expect(buttons.length).toBe(2);
  });

  it('does not show next button on last photo', () => {
    const { container } = render(
      <PhotoLightbox
        photos={photos}
        currentIndex={2}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );
    const buttons = container.querySelectorAll('button');
    // Only the close button and previous button should exist
    expect(buttons.length).toBe(2);
  });

  it('shows both navigation buttons for middle photo', () => {
    const { container } = render(
      <PhotoLightbox
        photos={photos}
        currentIndex={1}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );
    const buttons = container.querySelectorAll('button');
    // Close button + previous + next
    expect(buttons.length).toBe(3);
  });

  it('calls onNavigate with previous index when ArrowLeft pressed', () => {
    const onNavigate = vi.fn();
    render(
      <PhotoLightbox
        photos={photos}
        currentIndex={1}
        onClose={vi.fn()}
        onNavigate={onNavigate}
      />,
    );
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it('calls onNavigate with next index when ArrowRight pressed', () => {
    const onNavigate = vi.fn();
    render(
      <PhotoLightbox
        photos={photos}
        currentIndex={1}
        onClose={vi.fn()}
        onNavigate={onNavigate}
      />,
    );
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(onNavigate).toHaveBeenCalledWith(2);
  });
});
