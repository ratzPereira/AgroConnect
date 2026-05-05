import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutionPhotoUpload } from '../ExecutionPhotoUpload';

const mockMutate = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

vi.mock('@/api/executions', () => ({
  getPhotoUploadUrl: vi.fn(),
  confirmExecutionPhoto: vi.fn(),
}));

describe('ExecutionPhotoUpload', () => {
  const defaultProps = { executionId: 1, requestId: 10 };

  it('renders upload button', () => {
    render(<ExecutionPhotoUpload {...defaultProps} />);
    expect(screen.getByRole('button', { name: /carregar foto/i })).toBeInTheDocument();
  });

  it('shows error for files over 10MB', () => {
    render(<ExecutionPhotoUpload {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const largeFile = new File(['x'], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    expect(screen.getByText(/ficheiro \u00e9 demasiado grande/i)).toBeInTheDocument();
  });

  it('shows error for non-image files', () => {
    render(<ExecutionPhotoUpload {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const pdfFile = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    Object.defineProperty(pdfFile, 'size', { value: 1024 });

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    expect(screen.getByText(/apenas ficheiros de imagem/i)).toBeInTheDocument();
  });

  it('triggers file input when button is clicked', () => {
    render(<ExecutionPhotoUpload {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    fireEvent.click(screen.getByRole('button', { name: /carregar foto/i }));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
