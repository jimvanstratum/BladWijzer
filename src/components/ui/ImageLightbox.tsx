import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Swipe refs — all mutable state for touch handling in refs to avoid stale closures
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const dirLock = useRef<'h' | 'v' | null>(null);
  const currentOffset = useRef({ x: 0, y: 0 });

  // Reset bij openen
  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setLoaded(false);
      setSwipeOffset({ x: 0, y: 0 });
      setIsSwiping(false);
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

  // Direct touch handling — no separate hook, avoids ref-timing issues with Radix portal
  useEffect(() => {
    if (!open) return;

    // We need a small delay because Radix portal mounts the content async
    const timer = setTimeout(() => {
      const el = contentRef.current;
      if (!el) return;

      const onTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        // Negeer swipes die starten < 20px van schermrand (iOS back-gesture)
        if (touch.clientX < 20 || touch.clientX > window.innerWidth - 20) return;
        touchStart.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
        dirLock.current = null;
        currentOffset.current = { x: 0, y: 0 };
        setIsSwiping(true);
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!touchStart.current) return;
        const touch = e.touches[0];
        const dx = touch.clientX - touchStart.current.x;
        const dy = touch.clientY - touchStart.current.y;

        // Direction lock na 10px
        if (!dirLock.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
          dirLock.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        }

        if (dirLock.current === 'h') {
          e.preventDefault();
          // Rubber-band aan de randen
          let adjDx = dx;
          // index 0 = begin, index total-1 = einde
          const atStart = index === 0;
          const atEnd = index === total - 1;
          if ((atStart && dx > 0) || (atEnd && dx < 0)) {
            adjDx = dx * 0.25;
          }
          currentOffset.current = { x: adjDx, y: 0 };
          setSwipeOffset({ x: adjDx, y: 0 });
        } else if (dirLock.current === 'v') {
          const adjDy = Math.max(0, dy); // alleen omlaag
          currentOffset.current = { x: 0, y: adjDy };
          setSwipeOffset({ x: 0, y: adjDy });
        }
      };

      const onTouchEnd = () => {
        if (!touchStart.current) return;

        const { x: ox, y: oy } = currentOffset.current;
        const dt = Date.now() - touchStart.current.t;
        const vx = Math.abs(ox) / dt;
        const vy = Math.abs(oy) / dt;

        const threshold = 50;
        const velThreshold = 0.4;

        if (dirLock.current === 'h') {
          if (ox < -threshold || (ox < -20 && vx > velThreshold)) {
            // Swipe left → next
            setIndex((i) => {
              if (i >= total - 1) return i;
              setLoaded(false);
              return i + 1;
            });
          } else if (ox > threshold || (ox > 20 && vx > velThreshold)) {
            // Swipe right → prev
            setIndex((i) => {
              if (i <= 0) return i;
              setLoaded(false);
              return i - 1;
            });
          }
        } else if (dirLock.current === 'v') {
          if (oy > threshold || (oy > 20 && vy > velThreshold)) {
            onOpenChange(false);
          }
        }

        touchStart.current = null;
        dirLock.current = null;
        currentOffset.current = { x: 0, y: 0 };
        setSwipeOffset({ x: 0, y: 0 });
        setIsSwiping(false);
      };

      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchmove', onTouchMove, { passive: false });
      el.addEventListener('touchend', onTouchEnd, { passive: true });

      // Store cleanup ref
      (el as HTMLElement & { _swipeCleanup?: () => void })._swipeCleanup = () => {
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchmove', onTouchMove);
        el.removeEventListener('touchend', onTouchEnd);
      };
    }, 50);

    return () => {
      clearTimeout(timer);
      const el = contentRef.current;
      if (el) {
        (el as HTMLElement & { _swipeCleanup?: () => void })._swipeCleanup?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, total, onOpenChange]);

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
  const bgOpacity = isSwiping && swipeOffset.y > 0
    ? Math.max(0.3, 1 - swipeOffset.y / 300)
    : 1;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay: overdimensioned om altijd hele scherm + safe areas af te dekken */}
        <Dialog.Overlay
          className="fixed z-50 bg-black transition-opacity duration-200 data-[state=closed]:opacity-0"
          style={{
            top: '-100px',
            left: '-100px',
            right: '-100px',
            bottom: '-100px',
            opacity: bgOpacity,
          }}
        />
        <Dialog.Content
          ref={contentRef}
          onKeyDown={handleKeyDown}
          aria-label={`Afbeelding ${index + 1} van ${total}: ${current.alt}`}
          className={cn(
            'fixed inset-0 z-50 flex flex-col bg-black outline-none',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          )}
          style={{ height: 'var(--app-height, 100dvh)' }}
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
                  ? `translate(${swipeOffset.x}px, ${Math.max(0, swipeOffset.y)}px)`
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
          <div className="shrink-0" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
