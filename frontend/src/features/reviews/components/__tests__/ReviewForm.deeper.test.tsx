import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ReviewForm } from '../ReviewForm';
import { createReview } from '@/api/reviews';
import type { Review } from '@/types/review';

/* ── Mocks ───────────────────────────────────────────────── */

vi.mock('@/api/reviews', () => ({
  createReview: vi.fn(),
}));

const mockedCreateReview = vi.mocked(createReview);

const fakeReview: Review = {
  id: 1,
  requestId: 42,
  authorId: 10,
  authorName: 'João',
  targetId: 20,
  targetName: 'Maria',
  rating: 4,
  comment: 'Excelente serviço prestado, muito profissional.',
  createdAt: '2026-03-28T12:00:00Z',
};

/* ── Tests ───────────────────────────────────────────────── */

describe('ReviewForm — deeper coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Avaliar Serviço" heading', () => {
    renderWithProviders(<ReviewForm requestId={42} />);
    expect(screen.getByText('Avaliar Serviço')).toBeInTheDocument();
  });

  it('renders 5 star buttons', () => {
    renderWithProviders(<ReviewForm requestId={42} />);
    const starButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('type') === 'button',
    );
    expect(starButtons).toHaveLength(5);
  });

  it('renders comment textarea with correct label', () => {
    renderWithProviders(<ReviewForm requestId={42} />);
    expect(screen.getByLabelText(/comentário/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/descreva a sua experiência/i)).toBeInTheDocument();
  });

  it('renders submit button with "Enviar Avaliação" text', () => {
    renderWithProviders(<ReviewForm requestId={42} />);
    expect(screen.getByRole('button', { name: /enviar avaliação/i })).toBeInTheDocument();
  });

  it('star buttons highlight on click (fill-yellow-400 class applied)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReviewForm requestId={42} />);

    const starButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('type') === 'button',
    );

    // Click the third star
    await user.click(starButtons[2]);

    // Stars 1-3 should have the filled class, stars 4-5 should not
    for (let i = 0; i < 3; i++) {
      const svg = starButtons[i].querySelector('svg');
      expect(svg?.getAttribute('class')).toContain('fill-yellow-400');
    }
    for (let i = 3; i < 5; i++) {
      const svg = starButtons[i].querySelector('svg');
      expect(svg?.getAttribute('class')).not.toContain('fill-yellow-400');
    }
  });

  it('shows validation error when submitting with no rating selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReviewForm requestId={42} />);

    // Type a valid comment but do not select a rating
    await user.type(screen.getByLabelText(/comentário/i), 'Este serviço foi excelente e recomendo.');
    await user.click(screen.getByRole('button', { name: /enviar avaliação/i }));

    await waitFor(() => {
      expect(screen.getByText(/selecione uma avaliação/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short comment (<10 chars)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReviewForm requestId={42} />);

    // Select a star rating
    const starButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('type') === 'button',
    );
    await user.click(starButtons[3]);

    // Type a short comment
    await user.type(screen.getByLabelText(/comentário/i), 'Bom');
    await user.click(screen.getByRole('button', { name: /enviar avaliação/i }));

    await waitFor(() => {
      expect(screen.getByText(/pelo menos 10 caracteres/i)).toBeInTheDocument();
    });
  });

  it('shows error message when mutation fails', async () => {
    const user = userEvent.setup();
    mockedCreateReview.mockRejectedValueOnce(new Error('Server error'));

    renderWithProviders(<ReviewForm requestId={42} />);

    // Fill valid form data
    const starButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('type') === 'button',
    );
    await user.click(starButtons[4]);
    await user.type(
      screen.getByLabelText(/comentário/i),
      'Serviço muito bom, recomendo a todos.',
    );
    await user.click(screen.getByRole('button', { name: /enviar avaliação/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/erro ao enviar avaliação/i),
      ).toBeInTheDocument();
    });
  });

  it('shows success message when mutation succeeds', async () => {
    const user = userEvent.setup();
    mockedCreateReview.mockResolvedValueOnce(fakeReview);

    renderWithProviders(<ReviewForm requestId={42} />);

    // Fill valid form data
    const starButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('type') === 'button',
    );
    await user.click(starButtons[3]);
    await user.type(
      screen.getByLabelText(/comentário/i),
      'Excelente serviço prestado, muito profissional.',
    );
    await user.click(screen.getByRole('button', { name: /enviar avaliação/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/avaliação enviada com sucesso/i),
      ).toBeInTheDocument();
    });
  });

  it('calls createReview with correct requestId and form data on valid submit', async () => {
    const user = userEvent.setup();
    mockedCreateReview.mockResolvedValueOnce(fakeReview);

    renderWithProviders(<ReviewForm requestId={42} />);

    // Select 5 stars
    const starButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('type') === 'button',
    );
    await user.click(starButtons[4]);

    // Type a valid comment
    const commentText = 'Trabalho impecável, muito satisfeito com o resultado.';
    await user.type(screen.getByLabelText(/comentário/i), commentText);
    await user.click(screen.getByRole('button', { name: /enviar avaliação/i }));

    await waitFor(() => {
      expect(mockedCreateReview).toHaveBeenCalledWith(42, {
        rating: 5,
        comment: commentText,
      });
    });
  });

  it('resets the form after successful submission', async () => {
    const user = userEvent.setup();
    mockedCreateReview.mockResolvedValueOnce(fakeReview);

    renderWithProviders(<ReviewForm requestId={42} />);

    // Fill and submit
    const starButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('type') === 'button',
    );
    await user.click(starButtons[2]);
    await user.type(
      screen.getByLabelText(/comentário/i),
      'Serviço excelente e dentro do prazo combinado.',
    );
    await user.click(screen.getByRole('button', { name: /enviar avaliação/i }));

    // Wait for success, then check form is reset
    await waitFor(() => {
      expect(screen.getByText(/avaliação enviada com sucesso/i)).toBeInTheDocument();
    });

    // Comment should be empty after reset
    const textarea = screen.getByLabelText(/comentário/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');

    // Stars should all be unfilled after reset
    for (const btn of starButtons) {
      const svg = btn.querySelector('svg');
      expect(svg?.getAttribute('class')).not.toContain('fill-yellow-400');
    }
  });
});
