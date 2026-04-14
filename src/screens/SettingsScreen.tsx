import { useRef, useState } from 'react';
import { Download, Upload, Share2, Sun, Moon, Monitor, Smartphone } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { daysSinceLastBackup, exportBackup, importBackup, shareBackup } from '@/lib/export';
import { cn } from '@/lib/utils';

type Theme = 'system' | 'light' | 'dark';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
  localStorage.setItem('bladwijzer-theme', theme);
}

function readTheme(): Theme {
  return (localStorage.getItem('bladwijzer-theme') as Theme | null) ?? 'system';
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function SettingsScreen() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastBackup = daysSinceLastBackup();
  const shareSupported =
    typeof navigator !== 'undefined' &&
    typeof (navigator as Navigator & { canShare?: unknown }).canShare === 'function';

  const onTheme = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mode = confirm('OK = alle huidige planten vervangen. Annuleren = samenvoegen.')
      ? 'replace'
      : 'merge';
    try {
      const count = await importBackup(file, mode);
      setMsg(`${count} planten geïmporteerd (${mode === 'replace' ? 'vervangen' : 'samengevoegd'}).`);
    } catch (err) {
      setMsg(`Fout: ${(err as Error).message}`);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const onShare = async () => {
    try {
      const shared = await shareBackup();
      if (shared) setMsg('Backup klaar om te bewaren. Kies bijv. "Notities" of "iCloud Drive".');
    } catch (err) {
      setMsg(`Fout: ${(err as Error).message}`);
    }
  };

  const onExport = async () => {
    try {
      await exportBackup();
      setMsg('Backup gedownload.');
    } catch (err) {
      setMsg(`Fout: ${(err as Error).message}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      <AppHeader title="Instellingen" />

      {/* INSTALLATIE */}
      {!isStandalone() && (
        <section className="px-4 md:px-6">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Smartphone size={20} className="text-primary" />
                <h2 className="font-serif text-xl font-medium">App installeren</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Installeer BladWijzer als app op je beginscherm — dan opent hij sneller en werkt
                hij zonder browserbalk.
              </p>
              {isIOS() ? (
                <ol className="flex flex-col gap-1.5 text-sm leading-relaxed">
                  <li>
                    1. Tik op het <strong>deel-icoon</strong> onderaan Safari (
                    <span aria-hidden>􀈂</span>).
                  </li>
                  <li>
                    2. Scroll en kies <strong>"Zet op beginscherm"</strong>.
                  </li>
                  <li>3. Tik op "Voeg toe" rechtsboven.</li>
                </ol>
              ) : (
                <ol className="flex flex-col gap-1.5 text-sm leading-relaxed">
                  <li>
                    1. Tik op het <strong>menu</strong> (⋮) rechtsboven in de browser.
                  </li>
                  <li>
                    2. Kies <strong>"App installeren"</strong> of{' '}
                    <strong>"Toevoegen aan beginscherm"</strong>.
                  </li>
                  <li>3. Bevestigen.</li>
                </ol>
              )}
              <p className="text-xs text-muted-foreground">
                Eenmaal geïnstalleerd opent hij zoals elke andere app vanaf je beginscherm.
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* THEMA */}
      <section className="px-4 md:px-6">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <h2 className="font-serif text-xl font-medium">Thema</h2>
            <div className="flex gap-2">
              {(
                [
                  { id: 'system', label: 'Systeem', icon: Monitor },
                  { id: 'light', label: 'Licht', icon: Sun },
                  { id: 'dark', label: 'Donker', icon: Moon },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onTheme(id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                    theme === id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-bg text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* BACKUP */}
      <section className="px-4 md:px-6">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div>
              <h2 className="font-serif text-xl font-medium">Backup</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Je plantenlijst en foto's staan lokaal op dit toestel. Maak regelmatig een backup
                zodat je niets kwijtraakt.
              </p>
              <p
                className={cn(
                  'mt-2 text-sm',
                  lastBackup === null || lastBackup > 30
                    ? 'text-destructive'
                    : 'text-muted-foreground',
                )}
              >
                {lastBackup === null
                  ? 'Nog geen backup gemaakt op dit toestel.'
                  : lastBackup === 0
                  ? 'Laatste backup: vandaag.'
                  : `Laatste backup: ${lastBackup} dagen geleden.`}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {shareSupported && (
                <Button size="lg" onClick={onShare} className="w-full">
                  <Share2 size={18} /> Backup delen (Notities, iCloud, Mail…)
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={onExport} className="w-full">
                <Download size={18} /> Backup downloaden (JSON)
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={18} /> Backup importeren
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={onImport}
              />
            </div>

            {msg && <p className="text-sm text-primary">{msg}</p>}

            <p className="text-xs text-muted-foreground">
              Tip: bewaar de backup op iCloud Drive of Google Drive voor toegang op andere
              apparaten.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* OVER */}
      <section className="px-4 md:px-6">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <h2 className="font-serif text-xl font-medium">Over</h2>
            <p className="text-sm text-muted-foreground">
              BladWijzer — persoonlijke plantenapp. Data staat lokaal op dit toestel. Afbeeldingen
              worden getoond via Wikimedia Commons.
            </p>
            <p className="text-xs text-muted-foreground">Versie 0.2.0</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
