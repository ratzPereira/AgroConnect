import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewForm } from '../ReviewForm';

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

vi.mock('@/api/reviews', () => ({
  createReview: vi.fn(),
}));

describe('ReviewForm', () => {
  it('renders 5 star buttons', () => {
    render(<ReviewForm requestId={1} />);
    // Each star is a button with type="button" inside the rating section
    const starButtons = screen.getAllByRole('button', { name: '' }).filter((btn) =>
      btn.getAttribute('type') === 'button',
    );
    // 5 star buttons (type="button") exist in the form
    expect(starButtons.length).toBe(5);
  });

  it('renders comment textarea', () => {
    render(<ReviewForm requestId={1} />);
    expect(screen.getByLabelText(/coment\u00e1rio/i)).toBeInTheDocument();
  });

  it('renders submit button with "Enviar Avalia\u00e7\u00e3o" text', () => {
    render(<ReviewForm requestId={1} />);
    expect(screen.getByRole('button', { name: /enviar avalia\u00e7\u00e3o/i })).toBeInTheDocument();
  });

  it('shows "Avaliar Servi\u00e7o" heading', () => {
    render(<ReviewForm requestId={1} />);
    expect(screen.getByText('Avaliar Servi\u00e7o')).toBeInTheDocument();
  });
});
