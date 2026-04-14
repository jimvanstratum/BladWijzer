import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipe } from '@/hooks/useSwipe';
import { cn } from '@/lib/utils';

export interface LightboxImage {
  src: string;        // fullUrl of objectURL
  thumbSrc?: string;  // thumbUrl als preview tijdens laden
  alt: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset bij openen
  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setLoaded(false);
    }
  }, [open, initialIndex]);

  const total = images.length;
  const current = images[index];

  const goPrev = useCallback(() => {
    setIndex((i) => {
      if (i <= 0) return i;
      setLoaded(false);
      return i - 1;
    });
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= total - 1) return i;
      setLoaded(false);
      return i + 1;
    });
  }, [total]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Swipe
  const { offsetX, offsetY, isSwiping } = useSwipe(
    containerRef,
    {
      onSwipeLeft: goNext,
      onSwipeRight: goPrev,
      onSwipeDown: close,
    },
    index === 0,
    index === total - 1,
  );

  // Keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    },
    [goPrev, goNext],
  );

  if (!current) return null;

  // Bepaal src: toon thumb als preview, full als geladen
  const displaySrc = loaded ? current.src : (current.thumbSrc ?? current.src);

  // Opacity voor swipe-down-to-close
  const bgOpacity = isSwiping && offsetY > 0
    ? Math.max(0.3, 1 - offsetY / 300)
    : 1;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black transition-opacity duration-200 data-[state=closed]:opacity-0"
          style={{ opacity: bgOpacity }}
        />
        <Dialog.Content
          ref={containerRef}
          onKeyDown={handleKeyDown}
          aria-label={`Afbeelding ${index + 1} van ${total}: ${current.alt}`}
          className={cn(
            'fixed inset-0 z-50 flex flex-col bg-black outline-none',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          )}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between px-4 py-3" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
            <span aria-live="polite" className="text-sm font-medium text-white/80">
              {index + 1} / {total}
            </span>
            <Dialog.Close asChild>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label="Sluiten"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          {/* Image area */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2">
            <img
              src={displaySrc}
              alt={current.alt}
              onLoad={() => {
                if (displaySrc === current.src) setLoaded(true);
              }}
              className={cn(
                'max-h-full max-w-full object-contain select-none',
                !isSwiping && 'transition-transform duration-200 ease-out',
              )}
              style={{
                transform: isSwiping
                  ? `translate(${offsetX}px, ${Math.max(0, offsetY)}px)`
                  : undefined,
              }}
              draggable={false}
            />

            {/* Preload full-res image op achtergrond */}
            {current.thumbSrc && current.thumbSrc !== current.src && !loaded && (
              <img
                src={current.src}
                alt=""
                className="hidden"
                onLoad={() => setLoaded(true)}
              />
            )}

            {/* Desktop: navigatiepijlen */}
            {index > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:flex"
                aria-label="Vorige afbeelding"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            {index < total - 1 && (
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:flex"
                aria-label="Volgende afbeelding"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom spacer voor safe area */}
          <div className="shrink-0" style={{ height: 'var(--sab, 0px)' }} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
