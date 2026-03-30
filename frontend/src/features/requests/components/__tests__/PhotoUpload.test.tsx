import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhotoUpload } from '../PhotoUpload';
import type { RequestPhoto } from '@/types/request';

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

vi.mock('@/api/requests', () => ({
  getUploadUrl: vi.fn(),
  confirmPhoto: vi.fn(),
  deletePhoto: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPhotos: RequestPhoto[] = [
  { id: 1, photoUrl: 'https://example.com/photo1.jpg', sortOrder: 0, uploadedAt: '2026-03-01T10:00:00Z' },
  { id: 2, photoUrl: 'https://example.com/photo2.jpg', sortOrder: 1, uploadedAt: '2026-03-01T10:01:00Z' },
];

describe('PhotoUpload', () => {
  const defaultProps = {
    requestId: 1,
    photos: [] as RequestPhoto[],
    maxPhotos: 10,
  };

  it('renders upload drop zone when no photos exist', () => {
    render(<PhotoUpload {...defaultProps} />);
    expect(screen.getByText(/Arraste uma imagem/)).toBeInTheDocument();
    expect(screen.getByText(/JPEG, PNG ou WebP/)).toBeInTheDocument();
  });

  it('displays uploaded photos preview', () => {
    render(<PhotoUpload {...defaultProps} photos={mockPhotos} />);
    const images = screen.getAllByAltText('Foto do pedido');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/photo2.jpg');
  });

  it('shows photo count', () => {
    render(<PhotoUpload {...defaultProps} photos={mockPhotos} />);
    expect(screen.getByText('2/10 fotos')).toBeInTheDocument();
  });

  it('hides drop zone when max photos reached', () => {
    const maxPhotos = 2;
    render(<PhotoUpload {...defaultProps} photos={mockPhotos} maxPhotos={maxPhotos} />);
    expect(screen.queryByText(/Arraste uma imagem/)).not.toBeInTheDocument();
  });

  it('renders remove button on each photo', () => {
    render(<PhotoUpload {...defaultProps} photos={mockPhotos} />);
    const removeButtons = screen.getAllByLabelText('Remover foto');
    expect(removeButtons).toHaveLength(2);
  });

  it('has hidden file input with correct accept types', () => {
    render(<PhotoUpload {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    expect(fileInput.accept).toBe('image/jpeg,image/png,image/webp');
    expect(fileInput.className).toContain('hidden');
  });
});
