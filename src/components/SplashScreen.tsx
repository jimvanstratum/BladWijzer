import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const MIN_DURATION_MS = 900;
const FADE_DURATION_MS = 400;

export function SplashScreen() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'hidden'>('visible');

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase('fading'), MIN_DURATION_MS);
    const hideTimer = setTimeout(
      () => setPhase('hidden'),
      MIN_DURATION_MS + FADE_DURATION_MS,
    );
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (phase === 'hidden') return null;

  return (
    <div
      aria-hidden
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-bg transition-opacity',
        phase === 'fading' ? 'opacity-0' : 'opacity-100',
      )}
      style={{ transitionDuration: `${FADE_DURATION_MS}ms` }}
    >
      <img
        src={`${import.meta.env.BASE_URL}icon.svg`}
        alt=""
        className="h-20 w-20 rounded-2xl shadow-md"
      />
      <img
        src={`${import.meta.env.BASE_URL}wordlogo.svg`}
        alt="BladWijzer"
        className="h-10 max-w-[70vw] dark:invert"
      />
    </div>
  );
}
