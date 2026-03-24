import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUploadUrl, confirmPhoto, deletePhoto } from '@/api/requests';
import { ImagePlus, Trash2, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import type { RequestPhoto } from '@/types/request';

interface PhotoUploadProps {
  requestId: number;
  photos: RequestPhoto[];
  maxPhotos?: number;
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function PhotoUpload({ requestId, photos, maxPhotos = 10 }: PhotoUploadProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (photoId: number) => deletePhoto(requestId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      toast.success('Foto removida');
    },
    onError: () => toast.error('Erro ao remover foto'),
    onSettled: () => setDeletingId(null),
  });

  function validateFile(file: File): boolean {
    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error('Formato não suportado. Use JPEG, PNG ou WebP.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ficheiro demasiado grande. Máximo 5MB.');
      return false;
    }
    return true;
  }

  async function uploadFile(file: File) {
    if (!validateFile(file)) return;

    setUploading(true);

    // Show preview while uploading
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const { uploadUrl, publicUrl } = await getUploadUrl(requestId);

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      await confirmPhoto(requestId, publicUrl);
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      toast.success('Foto adicionada');
    } catch {
      toast.error('Erro ao carregar foto. Tente novamente.');
    } finally {
      setUploading(false);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
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

    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [requestId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddMore = photos.length < maxPhotos;
  const hasPhotos = photos.length > 0;

  return (
    <div>
      {/* Photo grid */}
      {hasPhotos && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square">
              <img
                src={photo.photoUrl}
                alt="Foto do pedido"
                className="w-full h-full object-cover rounded-lg border border-neutral-200"
              />
              <button
                type="button"
                onClick={() => {
                  setDeletingId(photo.id);
                  deleteMutation.mutate(photo.id);
                }}
                disabled={deletingId === photo.id}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                aria-label="Remover foto"
              >
                {deletingId === photo.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}

          {/* Upload preview placeholder */}
          {uploading && preview && (
            <div className="relative aspect-square">
              <img
                src={preview}
                alt="A carregar..."
                className="w-full h-full object-cover rounded-lg border border-primary-300 opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
            hasPhotos ? 'py-5' : 'py-8',
            dragOver
              ? 'border-primary-400 bg-primary-50 scale-[1.01]'
              : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
              <p className="text-sm text-primary-600 font-medium">A carregar...</p>
            </>
          ) : dragOver ? (
            <>
              <Upload className="h-8 w-8 text-primary-500" />
              <p className="text-sm text-primary-600 font-medium">Largue aqui</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100">
                <ImagePlus className="h-5 w-5 text-neutral-500" />
              </div>
              <div className="text-center">
                <p className="text-sm text-neutral-700 font-medium">
                  Arraste uma imagem ou <span className="text-primary-600">clique para escolher</span>
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  JPEG, PNG ou WebP, máx. 5MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      <p className="text-xs text-neutral-400 mt-2">
        {photos.length}/{maxPhotos} fotos
      </p>
    </div>
  );
}
