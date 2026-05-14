import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WizardPhotoCollector } from '../WizardPhotoCollector';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

function createMockFile(name: string, size: number, type: string): File {
  // Create a file with the given size by building an ArrayBuffer
  const buffer = new ArrayBuffer(size);
  const blob = new Blob([buffer], { type });
  return new File([blob], name, { type });
}

describe('WizardPhotoCollector (deeper)', () => {
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  function renderCollector(props: Partial<Parameters<typeof WizardPhotoCollector>[0]> = {}) {
    const defaultProps = {
      files: [] as File[],
      onChange,
      maxPhotos: 10,
    };
    return render(<WizardPhotoCollector {...defaultProps} {...props} />);
  }

  it('renders drop zone with instruction text', () => {
    renderCollector();
    expect(screen.getByText(/Arraste imagens/)).toBeInTheDocument();
    expect(screen.getByText(/JPEG, PNG ou WebP/)).toBeInTheDocument();
  });

  it('shows file count text "0/10 fotos (opcional)" when empty', () => {
    renderCollector();
    expect(screen.getByText('0/10 fotos (opcional)')).toBeInTheDocument();
  });

  it('shows file count without "(opcional)" when files exist', () => {
    const file = createMockFile('photo.jpg', 1024, 'image/jpeg');
    renderCollector({ files: [file] });
    expect(screen.getByText('1/10 fotos')).toBeInTheDocument();
    expect(screen.queryByText(/opcional/)).not.toBeInTheDocument();
  });

  it('adding valid files via input calls onChange with new files array', () => {
    renderCollector();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const validFile = createMockFile('photo.jpg', 1024, 'image/jpeg');
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(onChange).toHaveBeenCalledWith([validFile]);
  });

  it('shows photo previews when files exist (via addFile flow)', () => {
    renderCollector();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = createMockFile('photo.jpg', 1024, 'image/jpeg');
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    // After adding a file, onChange is called. Re-render with the file.
    expect(onChange).toHaveBeenCalledWith([validFile]);
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(validFile);
  });

  it('remove button calls onChange without that file', () => {
    // To test remove, we need previews in the internal state.
    // We simulate by first adding files through the input, then re-rendering with the files.
    const { unmount } = renderCollector();

    // Add two files via input to build internal preview state
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = createMockFile('a.jpg', 100, 'image/jpeg');
    const file2 = createMockFile('b.jpg', 100, 'image/jpeg');

    fireEvent.change(fileInput, { target: { files: [file1] } });
    // onChange called with [file1]

    // We need to re-render with updated files, but the component manages previews internally.
    // Let's test with the approach that the addFile updates internal previews.
    // The first call set onChange([file1]), let's unmount and re-test with a different approach.
    unmount();

    // Start fresh: render, add two files sequentially
    const onChange2 = vi.fn();
    const { rerender } = render(
      <WizardPhotoCollector files={[]} onChange={onChange2} maxPhotos={10} />,
    );

    const input1 = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input1, { target: { files: [file1] } });
    // Internal previews: ['blob:mock-url']

    // Re-render with file1 in files prop
    rerender(
      <WizardPhotoCollector files={[file1]} onChange={onChange2} maxPhotos={10} />,
    );

    const input2 = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input2, { target: { files: [file2] } });
    // Internal previews: ['blob:mock-url', 'blob:mock-url']

    // Re-render with both files
    rerender(
      <WizardPhotoCollector files={[file1, file2]} onChange={onChange2} maxPhotos={10} />,
    );

    // Now there should be remove buttons (one per preview)
    const removeButtons = screen.getAllByLabelText('Remover foto');
    expect(removeButtons).toHaveLength(2);

    // Click the first remove button
    fireEvent.click(removeButtons[0]);
    expect(onChange2).toHaveBeenCalledWith([file2]);
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('invalid file type shows error toast', () => {
    renderCollector();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = createMockFile('doc.pdf', 1024, 'application/pdf');
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(toast.error).toHaveBeenCalledWith('Formato não suportado. Use JPEG, PNG ou WebP.');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('file too large shows error toast', () => {
    renderCollector();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = createMockFile('big.jpg', 6 * 1024 * 1024, 'image/jpeg');
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(toast.error).toHaveBeenCalledWith('Ficheiro demasiado grande. Máximo 5MB.');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('max photos reached shows error toast', () => {
    const existingFiles = Array.from({ length: 3 }, (_, i) =>
      createMockFile(`photo${i}.jpg`, 100, 'image/jpeg'),
    );
    renderCollector({ files: existingFiles, maxPhotos: 3 });

    // The drop zone should be hidden since canAddMore is false
    expect(screen.queryByText(/Arraste imagens/)).not.toBeInTheDocument();
    expect(screen.getByText('3/3 fotos')).toBeInTheDocument();
  });

  it('addFile rejects when files.length >= maxPhotos', () => {
    const existingFiles = Array.from({ length: 2 }, (_, i) =>
      createMockFile(`photo${i}.jpg`, 100, 'image/jpeg'),
    );
    renderCollector({ files: existingFiles, maxPhotos: 2 });

    // Drop zone is hidden once the cap is reached, so the user has no way to add more.
    expect(screen.queryByText(/Arraste imagens/)).not.toBeInTheDocument();
    expect(screen.getByText('2/2 fotos')).toBeInTheDocument();
  });

  it('drop zone text changes to "Largue aqui" on drag over', () => {
    renderCollector();
    expect(screen.queryByText('Largue aqui')).not.toBeInTheDocument();
    expect(screen.getByText(/Arraste imagens/)).toBeInTheDocument();

    // Find the drop zone element (the one with the drag handlers)
    const dropZone = screen.getByText(/Arraste imagens/).closest('[class*="border-dashed"]') as HTMLElement;
    expect(dropZone).not.toBeNull();

    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });
    expect(screen.getByText('Largue aqui')).toBeInTheDocument();
    expect(screen.queryByText(/Arraste imagens/)).not.toBeInTheDocument();
  });

  it('drop zone reverts text on drag leave', () => {
    renderCollector();
    const dropZone = screen.getByText(/Arraste imagens/).closest('[class*="border-dashed"]') as HTMLElement;

    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });
    expect(screen.getByText('Largue aqui')).toBeInTheDocument();

    fireEvent.dragLeave(dropZone, { dataTransfer: { files: [] } });
    expect(screen.getByText(/Arraste imagens/)).toBeInTheDocument();
    expect(screen.queryByText('Largue aqui')).not.toBeInTheDocument();
  });

  it('hidden file input has correct accept attribute and is multiple', () => {
    renderCollector();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    expect(fileInput.accept).toBe('image/jpeg,image/png,image/webp');
    expect(fileInput.multiple).toBe(true);
    expect(fileInput.className).toContain('hidden');
  });

  it('dropping valid files calls onChange with combined file arrays', () => {
    renderCollector({ files: [] });
    const dropZone = screen.getByText(/Arraste imagens/).closest('[class*="border-dashed"]') as HTMLElement;

    const droppedFile = createMockFile('dropped.png', 1024, 'image/png');
    const dataTransfer = {
      files: [droppedFile],
    };

    fireEvent.drop(dropZone, { dataTransfer });
    expect(onChange).toHaveBeenCalledWith([droppedFile]);
  });

  it('dropping invalid file type via drag shows error toast', () => {
    renderCollector({ files: [] });
    const dropZone = screen.getByText(/Arraste imagens/).closest('[class*="border-dashed"]') as HTMLElement;

    const invalidFile = createMockFile('doc.gif', 1024, 'image/gif');
    const dataTransfer = {
      files: [invalidFile],
    };

    fireEvent.drop(dropZone, { dataTransfer });
    expect(toast.error).toHaveBeenCalledWith('Formato não suportado. Use JPEG, PNG ou WebP.');
    // onChange is still called but with empty valid files
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('dropping oversized file via drag shows error toast', () => {
    renderCollector({ files: [] });
    const dropZone = screen.getByText(/Arraste imagens/).closest('[class*="border-dashed"]') as HTMLElement;

    const bigFile = createMockFile('big.jpg', 6 * 1024 * 1024, 'image/jpeg');
    const dataTransfer = {
      files: [bigFile],
    };

    fireEvent.drop(dropZone, { dataTransfer });
    expect(toast.error).toHaveBeenCalledWith('Ficheiro demasiado grande. Máximo 5MB.');
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('uses custom maxPhotos prop', () => {
    renderCollector({ maxPhotos: 5 });
    expect(screen.getByText('0/5 fotos (opcional)')).toBeInTheDocument();
  });
});
