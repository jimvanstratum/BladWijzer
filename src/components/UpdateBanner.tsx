import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdateBanner() {
  useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) {
        reg.update().catch(() => {});
        setInterval(() => reg.update().catch(() => {}), 5 * 60 * 1000);
      }
    },
  });

  return null;
}
