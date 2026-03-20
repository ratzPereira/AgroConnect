import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPhotoUploadUrl, confirmExecutionPhoto } from '@/api/executions';
import { Button } from '@/components/ui/Button';
import { Upload } from 'lucide-react';
import axios from 'axios';

interface ExecutionPhotoUploadProps {
  executionId: number;
  requestId: number;
}

export function ExecutionPhotoUpload({ executionId, requestId }: ExecutionPhotoUploadProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setError(null);
      setUploading(true);

      // Step 1: Get presigned URL
      const presigned = await getPhotoUploadUrl(executionId);

      // Step 2: Upload file directly to MinIO/S3
      await axios.put(presigned.uploadUrl, file, {
        headers: { 'Content-Type': file.type },
      });

      // Step 3: Confirm photo with optional geolocation
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5_000,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch {
          // Geolocation is optional for photos
        }
      }

      return confirmExecutionPhoto(executionId, {
        photoUrl: presigned.publicUrl,
        latitude,
        longitude,
        takenAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution', requestId] });
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: () => {
      setError('Erro ao carregar foto. Tente novamente.');
      setUploading(false);
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('O ficheiro é demasiado grande. Máximo: 10 MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Apenas ficheiros de imagem são permitidos.');
      return;
    }

    uploadMutation.mutate(file);
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        loading={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        Carregar Foto
      </Button>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
