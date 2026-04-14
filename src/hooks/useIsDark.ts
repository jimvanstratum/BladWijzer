import { useEffect, useState } from 'react';

/**
 * Reactive hook that returns `true` when the app is in dark mode.
 * Watches both the `data-theme` attribute on `<html>` (set via Settings)
 * and the `prefers-color-scheme` media query (system default).
 */
export function useIsDark() {
  const [dark, setDark] = useState(() => {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const obs = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme');
      if (t === 'dark') setDark(true);
      else if (t === 'light') setDark(false);
      else setDark(mq.matches);
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    const handler = (e: MediaQueryListEvent) => {
      if (!document.documentElement.getAttribute('data-theme')) setDark(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => {
      obs.disconnect();
      mq.removeEventListener('change', handler);
    };
  }, []);

  return dark;
}
