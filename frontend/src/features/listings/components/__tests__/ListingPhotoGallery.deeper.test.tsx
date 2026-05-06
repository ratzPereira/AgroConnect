import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListingPhotoGallery } from '../ListingPhotoGallery';

/* ── Helpers ─────────────────────────────────────────────── */

const singlePhoto = ['https://example.com/photo1.jpg'];

const threePhotos = [
  'https://example.com/photo1.jpg',
  'https://example.com/photo2.jpg',
  'https://example.com/photo3.jpg',
];

const fivePhotos = [
  'https://example.com/photo1.jpg',
  'https://example.com/photo2.jpg',
  'https://example.com/photo3.jpg',
  'https://example.com/photo4.jpg',
  'https://example.com/photo5.jpg',
];

function openLightboxForSinglePhoto() {
  render(<ListingPhotoGallery photos={singlePhoto} />);
  const photoContainer = screen.getByAltText('Foto 1').closest('div[class*="cursor-pointer"]');
  if (photoContainer) {
    fireEvent.click(photoContainer);
  }
}

function openLightboxForMultiPhotos(photos: string[] = threePhotos) {
  render(<ListingPhotoGallery photos={photos} />);
  // Click the main photo in the desktop grid (alt="Foto principal")
  const mainPhoto = screen.getByAltText('Foto principal').closest('div[class*="cursor-pointer"]');
  if (mainPhoto) {
    fireEvent.click(mainPhoto);
  }
}

/* ── Tests ───────────────────────────────────────────────── */

describe('ListingPhotoGallery — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state with "Sem fotografias" when no photos', () => {
    render(<ListingPhotoGallery photos={[]} />);
    expect(screen.getByText('Sem fotografias')).toBeInTheDocument();
  });

  it('does not render any img elements in empty state', () => {
    render(<ListingPhotoGallery photos={[]} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders single photo with correct alt text', () => {
    render(<ListingPhotoGallery photos={singlePhoto} />);
    const img = screen.getByAltText('Foto 1');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo1.jpg');
  });

  it('opens lightbox on single photo click', () => {
    openLightboxForSinglePhoto();
    // Lightbox should be open with close button
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();
  });

  it('renders desktop grid for multiple photos', () => {
    render(<ListingPhotoGallery photos={threePhotos} />);
    // Desktop grid should have "Foto principal"
    expect(screen.getByAltText('Foto principal')).toBeInTheDocument();
    expect(screen.getByAltText('Foto 2')).toBeInTheDocument();
    expect(screen.getByAltText('Foto 3')).toBeInTheDocument();
  });

  it('renders mobile carousel for multiple photos', () => {
    render(<ListingPhotoGallery photos={threePhotos} />);
    // Mobile carousel has prev/next buttons with aria-label
    const prevButtons = screen.getAllByLabelText('Foto anterior');
    const nextButtons = screen.getAllByLabelText('Próxima foto');
    // Should exist (at least the mobile carousel ones)
    expect(prevButtons.length).toBeGreaterThanOrEqual(1);
    expect(nextButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "+2" overlay when there are 5 photos (more than 3)', () => {
    render(<ListingPhotoGallery photos={fivePhotos} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('shows "+1" overlay when there are 4 photos', () => {
    const fourPhotos = fivePhotos.slice(0, 4);
    render(<ListingPhotoGallery photos={fourPhotos} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('does not show "+N" overlay when exactly 3 photos', () => {
    render(<ListingPhotoGallery photos={threePhotos} />);
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('lightbox shows close button with "Fechar" aria-label', () => {
    openLightboxForSinglePhoto();
    const closeBtn = screen.getByLabelText('Fechar');
    expect(closeBtn).toBeInTheDocument();
  });

  it('closes lightbox on close button click', () => {
    openLightboxForSinglePhoto();
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Fechar'));

    // Lightbox should be closed
    expect(screen.queryByLabelText('Fechar')).not.toBeInTheDocument();
  });

  it('lightbox has prev/next buttons for multi-photo', () => {
    openLightboxForMultiPhotos();
    // Lightbox prev/next are the ones inside the lightbox overlay
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();
    // Multiple "Foto anterior"/"Próxima foto" buttons exist (mobile + lightbox)
    const prevButtons = screen.getAllByLabelText('Foto anterior');
    const nextButtons = screen.getAllByLabelText('Próxima foto');
    expect(prevButtons.length).toBeGreaterThanOrEqual(2); // mobile + lightbox
    expect(nextButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('keyboard Escape closes lightbox', () => {
    openLightboxForMultiPhotos();
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByLabelText('Fechar')).not.toBeInTheDocument();
  });

  it('keyboard ArrowRight navigates to next photo in lightbox', () => {
    openLightboxForMultiPhotos();

    // Initially showing photo at index 0 (alt="Foto 1" in lightbox)
    const lightboxOverlay = screen.getByLabelText('Fechar').closest('div[class*="fixed"]');
    expect(lightboxOverlay).toBeInTheDocument();

    // The lightbox img should show "Foto 1"
    const lightboxImgs = lightboxOverlay
      ? within(lightboxOverlay as HTMLElement).getAllByRole('img')
      : [];
    expect(lightboxImgs[0]).toHaveAttribute('alt', 'Foto 1');

    // Press ArrowRight
    fireEvent.keyDown(document, { key: 'ArrowRight' });

    // After navigation, lightbox should show "Foto 2"
    const updatedLightboxImgs = lightboxOverlay
      ? within(lightboxOverlay as HTMLElement).getAllByRole('img')
      : [];
    expect(updatedLightboxImgs[0]).toHaveAttribute('alt', 'Foto 2');
  });

  it('keyboard ArrowLeft navigates to previous photo (wraps around)', () => {
    openLightboxForMultiPhotos();

    // Initially at index 0, ArrowLeft should wrap to last photo
    fireEvent.keyDown(document, { key: 'ArrowLeft' });

    const lightboxOverlay = screen.getByLabelText('Fechar').closest('div[class*="fixed"]');
    const lightboxImgs = lightboxOverlay
      ? within(lightboxOverlay as HTMLElement).getAllByRole('img')
      : [];
    // Wrapped to last photo (index 2 for threePhotos)
    expect(lightboxImgs[0]).toHaveAttribute('alt', 'Foto 3');
  });

  it('shows dots indicator in lightbox for multiple photos', () => {
    openLightboxForMultiPhotos();

    // Each photo gets a dot button with aria-label "Foto N"
    expect(screen.getByLabelText('Foto 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Foto 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Foto 3')).toBeInTheDocument();
  });

  it('clicking a dot in lightbox navigates to that photo', async () => {
    const user = userEvent.setup();
    openLightboxForMultiPhotos();

    // Click dot for photo 3
    await user.click(screen.getByLabelText('Foto 3'));

    const lightboxOverlay = screen.getByLabelText('Fechar').closest('div[class*="fixed"]');
    const lightboxImgs = lightboxOverlay
      ? within(lightboxOverlay as HTMLElement).getAllByRole('img')
      : [];
    expect(lightboxImgs[0]).toHaveAttribute('alt', 'Foto 3');
  });

  it('does not show prev/next buttons in lightbox for single photo', () => {
    openLightboxForSinglePhoto();
    expect(screen.queryByLabelText('Foto anterior')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Próxima foto')).not.toBeInTheDocument();
  });

  it('opens lightbox via Enter key on single photo', () => {
    render(<ListingPhotoGallery photos={singlePhoto} />);
    const trigger = screen.getByLabelText('Abrir foto');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();
  });

  it('opens lightbox via Space key on single photo', () => {
    render(<ListingPhotoGallery photos={singlePhoto} />);
    const trigger = screen.getByLabelText('Abrir foto');
    fireEvent.keyDown(trigger, { key: ' ' });
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();
  });

  it('ignores other keys on single photo trigger', () => {
    render(<ListingPhotoGallery photos={singlePhoto} />);
    const trigger = screen.getByLabelText('Abrir foto');
    fireEvent.keyDown(trigger, { key: 'a' });
    expect(screen.queryByLabelText('Fechar')).not.toBeInTheDocument();
  });

  it('opens lightbox via Enter key on main photo (desktop grid)', () => {
    render(<ListingPhotoGallery photos={threePhotos} />);
    const main = screen.getByLabelText('Abrir foto principal');
    fireEvent.keyDown(main, { key: 'Enter' });
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();
  });

  it('opens lightbox via Space key on side photo "Foto 2"', () => {
    render(<ListingPhotoGallery photos={threePhotos} />);
    const side = screen.getByLabelText('Abrir foto 2');
    fireEvent.keyDown(side, { key: ' ' });
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();
  });

  it('opens lightbox via Enter key on side photo "Foto 3"', () => {
    render(<ListingPhotoGallery photos={threePhotos} />);
    const side = screen.getByLabelText('Abrir foto 3');
    fireEvent.keyDown(side, { key: 'Enter' });
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();
  });

  it('opens lightbox via Enter on "see all" placeholder for 2 photos', () => {
    const twoPhotos = threePhotos.slice(0, 2);
    render(<ListingPhotoGallery photos={twoPhotos} />);
    const placeholder = screen.getByLabelText('Abrir galeria');
    fireEvent.keyDown(placeholder, { key: 'Enter' });
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();
  });

  it('opens lightbox via Enter on mobile carousel trigger', () => {
    render(<ListingPhotoGallery photos={threePhotos} />);
    // There are multiple "Abrir foto" - mobile carousel + the side render of main photo. Pick the carousel one.
    const triggers = screen.getAllByLabelText('Abrir foto');
    fireEvent.keyDown(triggers[triggers.length - 1], { key: 'Enter' });
    expect(screen.getByLabelText('Fechar')).toBeInTheDocument();
  });

  it('lightbox backdrop closes on Escape keyDown handler', () => {
    openLightboxForMultiPhotos();
    const backdrop = screen.getByLabelText('Fechar visualização');
    fireEvent.keyDown(backdrop, { key: 'Escape' });
    expect(screen.queryByLabelText('Fechar')).not.toBeInTheDocument();
  });
});
