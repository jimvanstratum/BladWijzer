import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LightboxImage {
  src: string;
  thumbSrc?: string;
  alt: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Fullscreen image lightbox met carousel-stijl swipe.
 * Elke afbeelding is 100vw breed. Bij swipen schuift de hele strip
 * en glijdt de volgende afbeelding in beeld — zoals de iOS foto-app.
 */
export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Refs voor stable touch callbacks
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const dirLock = useRef<'h' | 'v' | null>(null);
  const dxRef = useRef(0);
  const dyRef = useRef(0);
  const indexRef = useRef(index);
  indexRef.current = index;
  const totalRef = useRef(images.length);
  totalRef.current = images.length;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const total = images.length;
  const current = images[index];

  // Reset bij openen
  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setDragX(0);
      setDragY(0);
      setIsDragging(false);
    }
  }, [open, initialIndex]);

  // Navigate
  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, []);
  const goNext = useCallback(() => {
    setIndex((i) => (i < totalRef.current - 1 ? i + 1 : i));
  }, []);

  // ─── Touch handling ───
  const onTouchStart = useCallback((e: TouchEvent) => {
    const t = e.touches[0];
    if (t.clientX < 16 || t.clientX > window.innerWidth - 16) return;
    touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    dirLock.current = null;
    dxRef.current = 0;
    dyRef.current = 0;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    if (!dirLock.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      dirLock.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }

    if (dirLock.current === 'h') {
      e.preventDefault();
      let adjDx = dx;
      if ((indexRef.current === 0 && dx > 0) ||
          (indexRef.current === totalRef.current - 1 && dx < 0)) {
        adjDx = dx * 0.2;
      }
      dxRef.current = adjDx;
      setDragX(adjDx);
    } else if (dirLock.current === 'v') {
      const adjDy = Math.max(0, dy);
      dyRef.current = adjDy;
      setDragY(adjDy);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current) return;
    const dx = dxRef.current;
    const dy = dyRef.current;
    const dt = Date.now() - touchStart.current.t;
    const vx = Math.abs(dx) / dt;
    const vy = Math.abs(dy) / dt;

    if (dirLock.current === 'h') {
      const w = window.innerWidth;
      if (dx < -(w * 0.25) || (dx < -30 && vx > 0.3)) {
        setIndex(i => (i < totalRef.current - 1 ? i + 1 : i));
      } else if (dx > (w * 0.25) || (dx > 30 && vx > 0.3)) {
        setIndex(i => (i > 0 ? i - 1 : i));
      }
    } else if (dirLock.current === 'v') {
      if (dy > 100 || (dy > 30 && vy > 0.3)) {
        onOpenChangeRef.current(false);
      }
    }

    touchStart.current = null;
    dirLock.current = null;
    dxRef.current = 0;
    dyRef.current = 0;
    setDragX(0);
    setDragY(0);
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    let el: HTMLElement | null = null;
    const timer = setTimeout(() => {
      el = contentRef.current;
      if (!el) return;
      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchmove', onTouchMove, { passive: false });
      el.addEventListener('touchend', onTouchEnd, { passive: true });
    }, 30);
    return () => {
      clearTimeout(timer);
      if (el) {
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchmove', onTouchMove);
        el.removeEventListener('touchend', onTouchEnd);
      }
    };
  }, [open, onTouchStart, onTouchMove, onTouchEnd]);

  // Keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    },
    [goPrev, goNext],
  );

  // Track viewport width for carousel calculations
  const [vw, setVw] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 375);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!current) return null;

  // Carousel translate: base position + drag offset in pixels
  const baseOffset = -index * vw;
  const translateX = baseOffset + (isDragging ? dragX : 0);

  // Swipe-down overlay dimming
  const bgOpacity = isDragging && dragY > 0
    ? Math.max(0.2, 1 - dragY / 300)
    : 1;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          className="fixed z-50 bg-black/80 backdrop-blur-2xl transition-opacity duration-200 data-[state=closed]:opacity-0"
          style={{ inset: '-200px', opacity: bgOpacity }}
        />

        <Dialog.Content
          ref={contentRef}
          onKeyDown={handleKeyDown}
          aria-describedby={undefined}
          className={cn(
            'fixed inset-0 z-50 flex flex-col outline-none',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          )}
          style={{ height: 'var(--app-height, 100dvh)' }}
        >
          <VisuallyHidden>
            <Dialog.Title>Afbeelding {index + 1} van {total}</Dialog.Title>
          </VisuallyHidden>
          {/* Header */}
          <div
            className="relative z-10 flex shrink-0 items-center justify-between px-4 py-3"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
          >
            <span
              aria-live="polite"
              className="rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm"
            >
              {index + 1} / {total}
            </span>
            <Dialog.Close asChild>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors active:bg-black/70"
                aria-label="Sluiten"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          {/* Carousel */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {/* Image strip — elke slide is exact viewport-breed */}
            <div
              className={cn(
                'flex h-full',
                !isDragging && 'transition-transform duration-300 ease-out',
              )}
              style={{
                transform: `translateX(${translateX}px) translateY(${isDragging ? Math.max(0, dragY) : 0}px)`,
              }}
            >
              {images.map((img, i) => {
                // Laad alleen huidige + directe buren
                const shouldLoad = Math.abs(i - index) <= 1;
                const imgSrc = shouldLoad ? img.src : undefined;

                return (
                  <div
                    key={`${img.src}-${i}`}
                    className="flex h-full shrink-0 items-center justify-center px-3"
                    style={{ width: `${vw}px` }}
                  >
                    {imgSrc && (
                      <img
                        src={imgSrc}
                        alt={img.alt}
                        className="max-h-full max-w-full rounded-lg object-contain select-none shadow-2xl"
                        draggable={false}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pijl links — altijd zichtbaar op mobiel */}
            {index > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-1.5 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur-sm transition-colors active:bg-black/60 md:left-3 md:h-11 md:w-11"
                aria-label="Vorige afbeelding"
              >
                <ChevronLeft size={22} />
              </button>
            )}
            {/* Pijl rechts — altijd zichtbaar op mobiel */}
            {index < total - 1 && (
              <button
                onClick={goNext}
                className="absolute right-1.5 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur-sm transition-colors active:bg-black/60 md:right-3 md:h-11 md:w-11"
                aria-label="Volgende afbeelding"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>

          {/* Bottom spacer */}
          <div className="shrink-0" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
