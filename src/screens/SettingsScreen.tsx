import { useRef, useState } from 'react';
import { Download, Upload, Sun, Moon, Monitor } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { exportBackup, importBackup } from '@/lib/export';
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

export function SettingsScreen() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-6">
      <AppHeader title="Instellingen" />

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

      <section className="px-4 md:px-6">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <h2 className="font-serif text-xl font-medium">Backup</h2>
            <p className="text-sm text-muted-foreground">
              Exporteer al je planten (incl. foto's) naar één JSON-bestand. Importeer later om te
              herstellen of samen te voegen.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={exportBackup} className="flex-1">
                <Download size={16} /> Exporteer backup
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={16} /> Importeer backup
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
          </CardContent>
        </Card>
      </section>

      <section className="px-4 md:px-6">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <h2 className="font-serif text-xl font-medium">Over</h2>
            <p className="text-sm text-muted-foreground">
              BladWijzer — persoonlijke plantenapp. Data staat lokaal op dit toestel. Afbeeldingen
              worden getoond via Wikimedia Commons.
            </p>
            <p className="text-xs text-muted-foreground">Versie 0.1.0</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
