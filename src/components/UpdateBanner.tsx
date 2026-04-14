import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdateBanner() {
  // autoUpdate: service worker activeert zichzelf en herlaadt automatisch.
  // We registreren alleen om periodieke checks te doen (elk uur).
  useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) {
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      }
    },
  });

  return null;
}
