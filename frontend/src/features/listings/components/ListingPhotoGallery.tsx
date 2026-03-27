import { useState, useCallback, useEffect } from 'react';
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ListingPhotoGalleryProps {
  photos: string[];
}

export function ListingPhotoGallery({ photos }: ListingPhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handlePrev = useCallback(() => {
    setActiveIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
  }, [photos.length]);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') setActiveIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
      if (e.key === 'ArrowRight') setActiveIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="aspect-[16/9] rounded-xl bg-neutral-100 flex flex-col items-center justify-center border border-neutral-200">
        <Camera className="h-12 w-12 text-neutral-300 mb-2" />
        <p className="text-sm text-neutral-400">Sem fotografias</p>
      </div>
    );
  }

  return (
    <>
      {/* Main photo */}
      <div className="relative group">
        <div
          className="aspect-[16/9] rounded-xl overflow-hidden bg-neutral-100 cursor-pointer"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={photos[activeIndex]}
            alt={`Foto ${activeIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-200"
          />
        </div>

        {/* Navigation arrows (only when multiple photos) */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/60"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/60"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Counter badge */}
        {photos.length > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-medium">
            {activeIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200',
                i === activeIndex
                  ? 'border-primary-500 ring-1 ring-primary-300'
                  : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <img
                src={url}
                alt={`Miniatura ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>

          <img
            src={photos[activeIndex]}
            alt={`Foto ${activeIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
          />

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium">
                {activeIndex + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
