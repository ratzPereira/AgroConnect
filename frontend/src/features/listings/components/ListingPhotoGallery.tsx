import { useState, useCallback, useEffect } from 'react';
import { Camera, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ListingPhotoGalleryProps {
  readonly photos: string[];
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

  function openAt(index: number) {
    setActiveIndex(index);
    setLightboxOpen(true);
  }

  function renderLightbox() {
    if (!lightboxOpen) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Visualização de foto"
      >
        <button
          type="button"
          onClick={() => setLightboxOpen(false)}
          aria-label="Fechar visualização"
          className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-default"
        />

        <button
          type="button"
          onClick={() => setLightboxOpen(false)}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <img
          src={photos[activeIndex]}
          alt={`Foto ${activeIndex + 1}`}
          className="relative max-w-[90vw] max-h-[80vh] object-contain rounded-lg pointer-events-none"
        />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/40 backdrop-blur-sm">
              {photos.map((photo, i) => (
                <button
                  key={`dot-${photo}`}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'rounded-full transition-all duration-200',
                    i === activeIndex
                      ? 'h-2.5 w-2.5 bg-white'
                      : 'h-2 w-2 bg-white/40 hover:bg-white/70',
                  )}
                  aria-label={`Foto ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="aspect-[4/3] sm:aspect-[3/2] rounded-2xl bg-neutral-100 flex flex-col items-center justify-center border border-neutral-200">
        <Camera className="h-12 w-12 text-neutral-300 mb-2" />
        <p className="text-sm text-neutral-400">Sem fotografias</p>
      </div>
    );
  }

  if (photos.length === 1) {
    return (
      <>
        <button
          type="button"
          className="group cursor-pointer rounded-2xl overflow-hidden bg-neutral-100 w-full"
          style={{ position: 'relative', height: 320 }}
          onClick={() => setLightboxOpen(true)}
          aria-label="Abrir foto"
        >
          <img
            src={photos[0]}
            alt="Foto 1"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
          <span className="absolute bottom-3 right-3 p-2 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ZoomIn className="h-4 w-4" />
          </span>
        </button>
        {renderLightbox()}
      </>
    );
  }

  return (
    <>
      {/* Desktop: grid layout (main + side) */}
      <div className="hidden sm:grid grid-cols-4 grid-rows-2 rounded-2xl overflow-hidden" style={{ gap: 8, height: 400 }}>
        <button
          type="button"
          className="col-span-3 row-span-2 group cursor-pointer bg-neutral-100"
          style={{ position: 'relative' }}
          onClick={() => openAt(0)}
          aria-label="Abrir foto principal"
        >
          <img
            src={photos[0]}
            alt="Foto principal"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
        </button>

        <button
          type="button"
          className="group cursor-pointer bg-neutral-100"
          style={{ position: 'relative' }}
          onClick={() => openAt(1)}
          aria-label="Abrir foto 2"
        >
          <img
            src={photos[1]}
            alt="Foto 2"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
        </button>

        {photos.length > 2 && (
          <button
            type="button"
            className="group cursor-pointer bg-neutral-100"
            style={{ position: 'relative' }}
            onClick={() => openAt(2)}
            aria-label="Abrir foto 3"
          >
            <img
              src={photos[2 % photos.length]}
              alt="Foto 3"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
            {photos.length > 3 && (
              <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  +{photos.length - 3}
                </span>
              </span>
            )}
          </button>
        )}
        {photos.length <= 2 && (
          <button
            type="button"
            className="group cursor-pointer bg-neutral-100"
            style={{ position: 'relative' }}
            onClick={() => openAt(0)}
            aria-label="Abrir galeria"
          >
            <span className="w-full h-full flex items-center justify-center bg-neutral-50">
              <ZoomIn className="h-6 w-6 text-neutral-300" />
            </span>
          </button>
        )}
      </div>

      {/* Mobile: carousel */}
      <div className="sm:hidden relative group">
        <button
          type="button"
          className="rounded-2xl overflow-hidden bg-neutral-100 cursor-pointer w-full block"
          style={{ position: 'relative', height: 280 }}
          onClick={() => setLightboxOpen(true)}
          aria-label="Abrir foto"
        >
          <img
            src={photos[activeIndex]}
            alt={`Foto ${activeIndex + 1}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </button>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((photo, i) => (
                <span
                  key={`indicator-${photo}`}
                  className={cn(
                    'rounded-full transition-all duration-200',
                    i === activeIndex
                      ? 'h-2 w-2 bg-white'
                      : 'h-1.5 w-1.5 bg-white/50',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {renderLightbox()}
    </>
  );
}
