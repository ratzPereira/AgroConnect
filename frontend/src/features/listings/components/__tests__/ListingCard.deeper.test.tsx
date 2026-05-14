import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListingCard } from '../ListingCard';
import type { ListingSummary } from '@/types/listing';

/* ── Fixtures ────────────────────────────────────────────── */

const baseListing: ListingSummary = {
  id: 1,
  title: 'Trator John Deere 5075E',
  price: 12500,
  priceNegotiable: false,
  category: 'EQUIPMENT',
  condition: 'USED',
  island: 'São Miguel',
  locationName: 'Ponta Delgada',
  latitude: 37.7483,
  longitude: -25.6666,
  firstPhotoUrl: 'https://example.com/tractor.jpg',
  createdAt: new Date(Date.now() - 3_600_000 * 2).toISOString(), // 2 hours ago
  status: 'ACTIVE',
  viewsCount: 42,
};

/* ── Tests ───────────────────────────────────────────────── */

describe('ListingCard — deeper coverage', () => {
  it('renders listing title', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText('Trator John Deere 5075E')).toBeInTheDocument();
  });

  it('renders price formatted with euro symbol', () => {
    render(<ListingCard listing={baseListing} />);
    // pt-PT formats 12500 as "12 500 €" (with non-breaking space)
    const priceEl = screen.getByText(/12[\s\u00a0]?500\s*€/);
    expect(priceEl).toBeInTheDocument();
  });

  it('renders "Sob consulta" when price is null', () => {
    render(<ListingCard listing={{ ...baseListing, price: null }} />);
    expect(screen.getByText('Sob consulta')).toBeInTheDocument();
  });

  it('renders "Negociável" badge when priceNegotiable is true', () => {
    render(<ListingCard listing={{ ...baseListing, priceNegotiable: true }} />);
    expect(screen.getByText('Negociável')).toBeInTheDocument();
  });

  it('does not render "Negociável" badge when priceNegotiable is false', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.queryByText('Negociável')).not.toBeInTheDocument();
  });

  it('renders category label "Equipamento"', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText('Equipamento')).toBeInTheDocument();
  });

  it('renders category label "Animais" for ANIMALS category', () => {
    render(<ListingCard listing={{ ...baseListing, category: 'ANIMALS' }} />);
    expect(screen.getByText('Animais')).toBeInTheDocument();
  });

  it('renders condition label "Usado" for USED condition', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText('Usado')).toBeInTheDocument();
  });

  it('renders condition label "Novo" for NEW condition', () => {
    render(<ListingCard listing={{ ...baseListing, condition: 'NEW' }} />);
    expect(screen.getByText('Novo')).toBeInTheDocument();
  });

  it('renders condition label "Semi-novo" for LIKE_NEW condition', () => {
    render(<ListingCard listing={{ ...baseListing, condition: 'LIKE_NEW' }} />);
    expect(screen.getByText('Semi-novo')).toBeInTheDocument();
  });

  it('does not render condition badge when condition is null', () => {
    render(<ListingCard listing={{ ...baseListing, condition: null }} />);
    expect(screen.queryByText('Novo')).not.toBeInTheDocument();
    expect(screen.queryByText('Usado')).not.toBeInTheDocument();
    expect(screen.queryByText('Semi-novo')).not.toBeInTheDocument();
  });

  it('renders island location', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText(/São Miguel/)).toBeInTheDocument();
  });

  it('renders location name when present', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText(/Ponta Delgada/)).toBeInTheDocument();
  });

  it('renders island alone when locationName is null', () => {
    render(<ListingCard listing={{ ...baseListing, locationName: null }} />);
    const locationSpan = screen.getByText('São Miguel');
    expect(locationSpan).toBeInTheDocument();
    // Should not contain a comma since there is no locationName
    expect(locationSpan.textContent).not.toContain(',');
  });

  it('renders views count', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('does not render views count when viewsCount is 0', () => {
    render(<ListingCard listing={{ ...baseListing, viewsCount: 0 }} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ListingCard listing={baseListing} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders as native button (keyboard handled by browser)', () => {
    const onClick = vi.fn();
    render(<ListingCard listing={baseListing} onClick={onClick} />);
    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('shows placeholder icon when no photo URL', () => {
    render(<ListingCard listing={{ ...baseListing, firstPhotoUrl: null }} />);
    // When there is no photo, no img tag should be rendered
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders image when firstPhotoUrl is provided', () => {
    render(<ListingCard listing={baseListing} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/tractor.jpg');
    expect(img).toHaveAttribute('alt', 'Trator John Deere 5075E');
  });

  it('shows placeholder icon on image error', () => {
    render(<ListingCard listing={baseListing} />);
    const img = screen.getByRole('img');

    // Simulate image load error
    fireEvent.error(img);

    // After error, img should be gone and placeholder should appear
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders all five category labels correctly', () => {
    const categories = [
      { category: 'ANIMALS' as const, label: 'Animais' },
      { category: 'PLANTS' as const, label: 'Plantas' },
      { category: 'SEEDS' as const, label: 'Sementes' },
      { category: 'PRODUCE' as const, label: 'Produção' },
      { category: 'EQUIPMENT' as const, label: 'Equipamento' },
    ];

    for (const { category, label } of categories) {
      const { unmount } = render(
        <ListingCard listing={{ ...baseListing, category }} />,
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('formats sub-euro prices with decimals', () => {
    render(<ListingCard listing={{ ...baseListing, price: 0.5 }} />);
    const priceEl = screen.getByText(/0,5\s*€/);
    expect(priceEl).toBeInTheDocument();
  });
});
