import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Periodic check once per hour while app is open
      if (reg) {
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      }
    },
  });

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (needRefresh) setVisible(true);
  }, [needRefresh]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-sm rounded-lg border border-primary/30 bg-bg p-3 shadow-lg md:bottom-6 md:right-6 md:left-auto md:mx-0"
    >
      <div className="flex items-start gap-3">
        <Sparkles size={20} className="mt-0.5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-fg">Nieuwe versie beschikbaar</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vernieuw om de laatste verbeteringen te gebruiken.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => updateServiceWorker(true)}>
              Vernieuwen
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNeedRefresh(false);
                setVisible(false);
              }}
            >
              Later
            </Button>
          </div>
        </div>
        <button
          aria-label="Sluiten"
          onClick={() => {
            setNeedRefresh(false);
            setVisible(false);
          }}
          className="text-muted-foreground hover:text-fg"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
