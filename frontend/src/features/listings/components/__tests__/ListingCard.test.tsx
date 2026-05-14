import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListingCard } from '../ListingCard';
import type { ListingSummary } from '@/types/listing';

const baseListing: ListingSummary = {
  id: 1,
  title: 'Vitelos Mertolengos',
  price: 850,
  priceNegotiable: false,
  category: 'ANIMALS',
  condition: null,
  island: 'Terceira',
  locationName: 'Angra do Heroísmo',
  latitude: 38.6545,
  longitude: -27.2167,
  firstPhotoUrl: null,
  createdAt: '2026-03-15T10:00:00Z',
  status: 'ACTIVE',
  viewsCount: 5,
};

describe('ListingCard', () => {
  it('renders listing title', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText('Vitelos Mertolengos')).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    render(<ListingCard listing={baseListing} />);
    // 850 formatted in pt-PT with no decimals + euro
    expect(screen.getByText(/850/)).toBeInTheDocument();
  });

  it('renders "Sob consulta" when price is null', () => {
    const noPriceListing: ListingSummary = { ...baseListing, price: null };
    render(<ListingCard listing={noPriceListing} />);
    expect(screen.getByText('Sob consulta')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText('Animais')).toBeInTheDocument();
  });

  it('renders location info', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText(/Terceira/)).toBeInTheDocument();
    expect(screen.getByText(/Angra do Heroísmo/)).toBeInTheDocument();
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
  });

  it('renders condition badge when condition is provided', () => {
    const listingWithCondition: ListingSummary = { ...baseListing, condition: 'NEW' };
    render(<ListingCard listing={listingWithCondition} />);
    expect(screen.getByText('Novo')).toBeInTheDocument();
  });

  it('renders "Negociável" when price is negotiable', () => {
    const negotiableListing: ListingSummary = { ...baseListing, priceNegotiable: true };
    render(<ListingCard listing={negotiableListing} />);
    expect(screen.getByText('Negociável')).toBeInTheDocument();
  });

  it('renders views count when greater than 0', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not render views count when 0', () => {
    const noViewsListing: ListingSummary = { ...baseListing, viewsCount: 0 };
    render(<ListingCard listing={noViewsListing} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders different category labels correctly', () => {
    const plantListing: ListingSummary = { ...baseListing, category: 'PLANTS' };
    render(<ListingCard listing={plantListing} />);
    expect(screen.getByText('Plantas')).toBeInTheDocument();
  });
});
