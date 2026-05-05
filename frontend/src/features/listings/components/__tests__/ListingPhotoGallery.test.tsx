import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListingPhotoGallery } from '../ListingPhotoGallery';

describe('ListingPhotoGallery', () => {
  it('renders "no photos" state when empty', () => {
    render(<ListingPhotoGallery photos={[]} />);
    expect(screen.getByText('Sem fotografias')).toBeInTheDocument();
  });

  it('renders photo grid with multiple photos', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg',
    ];
    render(<ListingPhotoGallery photos={photos} />);
    // Main photo + side photos on desktop grid
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(3);
  });

  it('renders single photo layout correctly', () => {
    const photos = ['https://example.com/photo1.jpg'];
    render(<ListingPhotoGallery photos={photos} />);
    const img = screen.getByAltText('Foto 1');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo1.jpg');
  });

  it('opens lightbox on photo click', () => {
    const photos = ['https://example.com/photo1.jpg'];
    render(<ListingPhotoGallery photos={photos} />);

    // Click on the photo to open the lightbox
    const photoContainer = screen.getByAltText('Foto 1').closest('div[class*="cursor-pointer"]');
    if (photoContainer) {
      fireEvent.click(photoContainer);
    }

    // Lightbox should show a close button
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();
  });

  it('shows "+N" overlay when more than 3 photos', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg',
      'https://example.com/photo4.jpg',
      'https://example.com/photo5.jpg',
    ];
    render(<ListingPhotoGallery photos={photos} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
