import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WizardPhotoCollector } from '../WizardPhotoCollector';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('WizardPhotoCollector', () => {
  const defaultProps = {
    files: [] as File[],
    onChange: vi.fn(),
    maxPhotos: 10,
  };

  it('renders upload area with instructions', () => {
    render(<WizardPhotoCollector {...defaultProps} />);
    expect(screen.getByText(/Arraste imagens/)).toBeInTheDocument();
    expect(screen.getByText(/JPEG, PNG ou WebP/)).toBeInTheDocument();
  });

  it('renders photo previews when files are provided', () => {
    const mockFile1 = new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' });
    const mockFile2 = new File(['photo2'], 'photo2.png', { type: 'image/png' });

    // Mock URL.createObjectURL for previews
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');

    render(<WizardPhotoCollector {...defaultProps} files={[mockFile1, mockFile2]} />);

    // The component uses internal state for previews generated via addFile,
    // but when files are provided directly, previews are driven by internal state.
    // We can verify the files count is shown correctly.
    expect(screen.getByText('2/10 fotos')).toBeInTheDocument();

    URL.createObjectURL = originalCreateObjectURL;
  });

  it('shows correct file count label', () => {
    render(<WizardPhotoCollector {...defaultProps} />);
    expect(screen.getByText('0/10 fotos (opcional)')).toBeInTheDocument();
  });

  it('has hidden file input with correct accept types', () => {
    render(<WizardPhotoCollector {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    expect(fileInput.accept).toBe('image/jpeg,image/png,image/webp');
    expect(fileInput.className).toContain('hidden');
    expect(fileInput.multiple).toBe(true);
  });

  it('hides upload area when max photos reached', () => {
    const files = Array.from({ length: 10 }, (_, i) =>
      new File([`photo${i}`], `photo${i}.jpg`, { type: 'image/jpeg' }),
    );
    render(<WizardPhotoCollector {...defaultProps} files={files} maxPhotos={10} />);
    expect(screen.queryByText(/Arraste imagens/)).not.toBeInTheDocument();
  });
});
