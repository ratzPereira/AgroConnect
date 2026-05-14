import { useCallback, useRef, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

interface WizardPhotoCollectorProps {
  readonly files: File[];
  readonly onChange: (files: File[]) => void;
  readonly maxPhotos?: number;
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function WizardPhotoCollector({ files, onChange, maxPhotos = 10 }: WizardPhotoCollectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  function addFile(file: File) {
    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error('Formato não suportado. Use JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ficheiro demasiado grande. Máximo 5MB.');
      return;
    }
    if (files.length >= maxPhotos) {
      toast.error(`Máximo de ${maxPhotos} fotos atingido.`);
      return;
    }

    const preview = URL.createObjectURL(file);
    onChange([...files, file]);
    setPreviews((prev) => [...prev, preview]);
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]);
    onChange(files.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (selected) {
      Array.from(selected).forEach(addFile);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter((f) => {
      if (!ALLOWED_TYPES.has(f.type)) {
        toast.error('Formato não suportado. Use JPEG, PNG ou WebP.');
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error('Ficheiro demasiado grande. Máximo 5MB.');
        return false;
      }
      return true;
    });
    const newFiles = [...files, ...validFiles].slice(0, maxPhotos);
    const newPreviews = validFiles.slice(0, maxPhotos - files.length).map((f) => URL.createObjectURL(f));
    onChange(newFiles);
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, [files, maxPhotos, onChange]);

  const canAddMore = files.length < maxPhotos;

  return (
    <div>
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
          {previews.map((src, i) => (
            <div key={`preview-${src}-${i}`} className="relative group aspect-square">
              <img
                src={src}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-neutral-200"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                aria-label="Remover foto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <button
          type="button"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Adicionar foto"
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 w-full',
            files.length > 0 ? 'py-5' : 'py-8',
            dragOver
              ? 'border-primary-400 bg-primary-50 scale-[1.01]'
              : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50',
          )}
        >
          {dragOver ? (
            <>
              <Upload className="h-8 w-8 text-primary-500" />
              <span className="text-sm text-primary-600 font-medium">Largue aqui</span>
            </>
          ) : (
            <>
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100">
                <ImagePlus className="h-5 w-5 text-neutral-500" />
              </span>
              <span className="text-center block">
                <span className="block text-sm text-neutral-700 font-medium">
                  Arraste imagens ou <span className="text-primary-600">clique para escolher</span>
                </span>
                <span className="block text-xs text-neutral-400 mt-0.5">
                  JPEG, PNG ou WebP, máx. 5MB cada
                </span>
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <p className="text-xs text-neutral-400 mt-2">
        {files.length}/{maxPhotos} fotos {files.length === 0 && '(opcional)'}
      </p>
    </div>
  );
}
