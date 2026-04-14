import { useCallback, useEffect, useRef, useState } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  /** Minimum px om een swipe te triggeren (default 50) */
  threshold?: number;
  /** Minimum velocity in px/ms (default 0.4) — snelle flick triggert ook */
  velocityThreshold?: number;
}

interface SwipeState {
  offsetX: number;
  offsetY: number;
  isSwiping: boolean;
}

/**
 * Touch gesture hook voor swipe links/rechts/omlaag.
 * Gebruikt native event listeners (nodig voor preventDefault op iOS PWA).
 *
 * @param containerRef - ref naar het swipeable element
 * @param options - callbacks en thresholds
 * @param atStart - of we aan het begin van de lijst zijn (rubber-band links)
 * @param atEnd - of we aan het einde van de lijst zijn (rubber-band rechts)
 */
export function useSwipe(
  containerRef: React.RefObject<HTMLElement | null>,
  options: SwipeOptions,
  atStart = false,
  atEnd = false,
): SwipeState {
  const [state, setState] = useState<SwipeState>({
    offsetX: 0,
    offsetY: 0,
    isSwiping: false,
  });

  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const directionRef = useRef<'h' | 'v' | null>(null);
  // Track current offset in refs so handleTouchEnd never reads stale state
  const offsetRef = useRef({ x: 0, y: 0 });
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const atStartRef = useRef(atStart);
  atStartRef.current = atStart;
  const atEndRef = useRef(atEnd);
  atEndRef.current = atEnd;

  const thresholdRef = useRef(options.threshold ?? 50);
  thresholdRef.current = options.threshold ?? 50;
  const velocityRef = useRef(options.velocityThreshold ?? 0.4);
  velocityRef.current = options.velocityThreshold ?? 0.4;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    // Negeer swipes die starten < 20px van schermrand (iOS back-gesture)
    if (touch.clientX < 20 || touch.clientX > window.innerWidth - 20) return;
    startRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
    directionRef.current = null;
    offsetRef.current = { x: 0, y: 0 };
    setState({ offsetX: 0, offsetY: 0, isSwiping: true });
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!startRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;

    // Direction lock na 10px
    if (!directionRef.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      directionRef.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }

    if (directionRef.current === 'h') {
      e.preventDefault(); // blokkeert scroll
      // Rubber-band: dempen als we aan de rand zijn
      let adjustedDx = dx;
      if ((atStartRef.current && dx > 0) || (atEndRef.current && dx < 0)) {
        adjustedDx = dx * 0.25;
      }
      offsetRef.current = { x: adjustedDx, y: 0 };
      setState({ offsetX: adjustedDx, offsetY: 0, isSwiping: true });
    } else if (directionRef.current === 'v') {
      const adjustedDy = Math.max(0, dy); // alleen omlaag
      offsetRef.current = { x: 0, y: adjustedDy };
      setState({ offsetX: 0, offsetY: adjustedDy, isSwiping: true });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!startRef.current) return;

    // Read from ref — always fresh, never stale
    const { x: offsetX, y: offsetY } = offsetRef.current;
    const dt = Date.now() - startRef.current.t;
    const vx = Math.abs(offsetX) / dt;
    const vy = Math.abs(offsetY) / dt;

    const threshold = thresholdRef.current;
    const velocityThreshold = velocityRef.current;
    const opts = optionsRef.current;

    if (directionRef.current === 'h') {
      if (offsetX < -threshold || (offsetX < -20 && vx > velocityThreshold)) {
        opts.onSwipeLeft?.();
      } else if (offsetX > threshold || (offsetX > 20 && vx > velocityThreshold)) {
        opts.onSwipeRight?.();
      }
    } else if (directionRef.current === 'v') {
      if (offsetY > threshold || (offsetY > 20 && vy > velocityThreshold)) {
        opts.onSwipeDown?.();
      }
    }

    startRef.current = null;
    directionRef.current = null;
    offsetRef.current = { x: 0, y: 0 };
    setState({ offsetX: 0, offsetY: 0, isSwiping: false });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return state;
}
