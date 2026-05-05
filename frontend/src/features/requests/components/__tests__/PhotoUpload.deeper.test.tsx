import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { RequestPhoto } from '@/types/request';

// ── Mock toast ─────────────────────────────────────────────────────────────
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

// ── Mock API ───────────────────────────────────────────────────────────────
const mockGetUploadUrl = vi.fn();
const mockConfirmPhoto = vi.fn();
const mockDeletePhoto = vi.fn();

vi.mock('@/api/requests', () => ({
  getUploadUrl: (...args: unknown[]) => mockGetUploadUrl(...args),
  confirmPhoto: (...args: unknown[]) => mockConfirmPhoto(...args),
  deletePhoto: (...args: unknown[]) => mockDeletePhoto(...args),
}));

// ── Mock global fetch ──────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Mock URL methods ───────────────────────────────────────────────────────
vi.stubGlobal('URL', {
  ...URL,
  createObjectURL: vi.fn(() => 'blob:http://localhost/preview-123'),
  revokeObjectURL: vi.fn(),
});

// ── Mock React Query ───────────────────────────────────────────────────────
const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();

let deleteMutationIsError: boolean;

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(({ mutationFn, onSuccess, onError, onSettled }: {
    mutationFn: (id: number) => Promise<void>;
    onSuccess?: () => void;
    onError?: () => void;
    onSettled?: () => void;
  }) => ({
    mutate: (photoId: number) => {
      mockMutate(photoId);
      mutationFn(photoId)
        .then(() => onSuccess?.())
        .catch(() => onError?.())
        .finally(() => onSettled?.());
    },
    isPending: false,
    isError: deleteMutationIsError,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}));

import { PhotoUpload } from '../PhotoUpload';

// ── Helpers ────────────────────────────────────────────────────────────────

function makePhoto(overrides: Partial<RequestPhoto> = {}): RequestPhoto {
  return {
    id: 1,
    photoUrl: 'https://cdn.example.com/photo1.jpg',
    sortOrder: 0,
    uploadedAt: '2026-03-01T10:00:00Z',
    ...overrides,
  };
}

const threePhotos: RequestPhoto[] = [
  makePhoto({ id: 1, photoUrl: 'https://cdn.example.com/a.jpg', sortOrder: 0 }),
  makePhoto({ id: 2, photoUrl: 'https://cdn.example.com/b.jpg', sortOrder: 1 }),
  makePhoto({ id: 3, photoUrl: 'https://cdn.example.com/c.jpg', sortOrder: 2 }),
];

function createFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('PhotoUpload (deeper)', () => {
  const defaultProps = {
    requestId: 1,
    photos: [] as RequestPhoto[],
    maxPhotos: 10,
  };

  beforeEach(() => {
    mockMutate.mockReset();
    mockInvalidateQueries.mockReset();
    mockGetUploadUrl.mockReset();
    mockConfirmPhoto.mockReset();
    mockDeletePhoto.mockReset();
    mockFetch.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    deleteMutationIsError = false;
  });

  it('renders photo grid with existing photos', () => {
    render(<PhotoUpload {...defaultProps} photos={threePhotos} />);
    const images = screen.getAllByAltText('Foto do pedido');
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute('src', 'https://cdn.example.com/a.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://cdn.example.com/b.jpg');
    expect(images[2]).toHaveAttribute('src', 'https://cdn.example.com/c.jpg');
  });

  it('shows photo count (e.g. "3/10 fotos")', () => {
    render(<PhotoUpload {...defaultProps} photos={threePhotos} />);
    expect(screen.getByText('3/10 fotos')).toBeInTheDocument();
  });

  it('shows drop zone when under max photos', () => {
    render(<PhotoUpload {...defaultProps} photos={threePhotos} />);
    expect(screen.getByText(/Arraste uma imagem/)).toBeInTheDocument();
  });

  it('hides drop zone when at max photos', () => {
    render(<PhotoUpload {...defaultProps} photos={threePhotos} maxPhotos={3} />);
    expect(screen.queryByText(/Arraste uma imagem/)).not.toBeInTheDocument();
  });

  it('shows delete button on photos', () => {
    render(<PhotoUpload {...defaultProps} photos={threePhotos} />);
    const deleteButtons = screen.getAllByLabelText('Remover foto');
    expect(deleteButtons).toHaveLength(3);
  });

  it('calls deletePhoto mutation on delete click', () => {
    mockDeletePhoto.mockResolvedValue(undefined);
    render(<PhotoUpload {...defaultProps} photos={threePhotos} />);
    const deleteButtons = screen.getAllByLabelText('Remover foto');
    fireEvent.click(deleteButtons[1]);
    // The second photo (id=2) should be passed to the mutate
    expect(mockMutate).toHaveBeenCalledWith(2);
  });

  it('validates file type (rejects PDF)', () => {
    render(<PhotoUpload {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const pdfFile = createFile('document.pdf', 'application/pdf', 1024);
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    expect(mockToastError).toHaveBeenCalledWith(
      'Formato não suportado. Use JPEG, PNG ou WebP.',
    );
    // Should NOT call upload API
    expect(mockGetUploadUrl).not.toHaveBeenCalled();
  });

  it('validates file size (rejects >5MB)', () => {
    render(<PhotoUpload {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const bigFile = createFile('huge.jpg', 'image/jpeg', 6 * 1024 * 1024);
    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    expect(mockToastError).toHaveBeenCalledWith(
      'Ficheiro demasiado grande. Máximo 5MB.',
    );
    expect(mockGetUploadUrl).not.toHaveBeenCalled();
  });

  it('shows "Largue aqui" text on drag over', () => {
    render(<PhotoUpload {...defaultProps} />);
    // Find the drop zone container (parent of the "Arraste uma imagem" text)
    const dropZone = screen.getByText(/Arraste uma imagem/).closest('[class*="border-dashed"]') as HTMLElement;
    expect(dropZone).not.toBeNull();

    fireEvent.dragOver(dropZone, {
      dataTransfer: { files: [] },
    });

    expect(screen.getByText('Largue aqui')).toBeInTheDocument();
  });

  it('shows "A carregar..." during upload', async () => {
    // Make getUploadUrl hang so uploading state persists during assertion
    mockGetUploadUrl.mockReturnValue(new Promise(() => {
      // Never resolves — keeps uploading=true
    }));

    render(<PhotoUpload {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const validFile = createFile('photo.jpg', 'image/jpeg', 1024);
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.getByText('A carregar...')).toBeInTheDocument();
    });
  });

  it('renders file input with correct accept attribute', () => {
    render(<PhotoUpload {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    expect(fileInput.accept).toBe('image/jpeg,image/png,image/webp');
  });

  it('shows "Arraste uma imagem" default text', () => {
    render(<PhotoUpload {...defaultProps} />);
    expect(screen.getByText(/Arraste uma imagem/)).toBeInTheDocument();
    expect(screen.getByText(/clique para escolher/)).toBeInTheDocument();
  });
});
