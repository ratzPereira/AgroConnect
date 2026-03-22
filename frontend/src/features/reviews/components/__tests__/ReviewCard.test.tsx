import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewCard } from '../ReviewCard';
import { mockReview } from '@/test/mocks/data';

describe('ReviewCard', () => {
  it('renders author name', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText(mockReview.authorName)).toBeInTheDocument();
  });

  it('renders comment', () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText(mockReview.comment)).toBeInTheDocument();
  });

  it('renders formatted date in dd/MM/yyyy format', () => {
    render(<ReviewCard review={mockReview} />);
    // 2026-01-15T10:00:00Z -> 15/01/2026
    expect(screen.getByText('15/01/2026')).toBeInTheDocument();
  });

  it('renders five star icons', () => {
    const { container } = render(<ReviewCard review={mockReview} />);
    // The component renders 5 Star SVG icons
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBe(5);
  });

  it('fills stars up to the rating value', () => {
    const { container } = render(<ReviewCard review={mockReview} />);
    // mockReview.rating = 5, so all 5 stars should be filled (yellow)
    const filledStars = container.querySelectorAll('svg.fill-yellow-400');
    expect(filledStars.length).toBe(mockReview.rating);
  });

  it('renders unfilled stars for ratings less than 5', () => {
    const lowRatingReview = { ...mockReview, rating: 3 };
    const { container } = render(<ReviewCard review={lowRatingReview} />);
    const filledStars = container.querySelectorAll('svg.fill-yellow-400');
    const unfilledStars = container.querySelectorAll('svg.text-neutral-300');
    expect(filledStars.length).toBe(3);
    expect(unfilledStars.length).toBe(2);
  });
});
