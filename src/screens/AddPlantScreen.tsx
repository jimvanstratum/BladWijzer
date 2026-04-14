import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { Search, Leaf, Sun, Cloud } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { searchCatalog } from '@/data/catalog';
import { db } from '@/data/db';
import type { CatalogEntry, Location, MyPlant } from '@/types/plant';
import { formatPruneMonths } from '@/lib/prune';
import { cn } from '@/lib/utils';

export function AddPlantScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [manual, setManual] = useState(false);

  const [name, setName] = useState('');
  const [commonName, setCommonName] = useState('');
  const [latinName, setLatinName] = useState('');
  const [location, setLocation] = useState<Location>('buiten');
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  const results = useMemo(() => searchCatalog(query, 20), [query]);

  const selectCatalog = (entry: CatalogEntry) => {
    setSelected(entry);
    setCommonName(entry.commonName);
    setLatinName(entry.latinName);
    setName(entry.commonName);
    setLocation(entry.locationHint[0] ?? 'buiten');
    setManual(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !commonName.trim()) return;
    const plant: MyPlant = {
      id: uuid(),
      name: name.trim(),
      commonName: commonName.trim(),
      latinName: latinName.trim() || undefined,
      catalogId: selected?.id,
      location,
      room: room.trim() || undefined,
      notes: notes.trim() || undefined,
      photo: photoBlob ?? undefined,
      addedAt: new Date().toISOString(),
    };
    await db.plants.put(plant);
    navigate(`/plant/${plant.id}`, { replace: true });
  };

  return (
    <div className="flex flex-col gap-4 pb-16 md:pb-6">
      <AppHeader title="Plant toevoegen" subtitle="Zoek in de catalogus of voer handmatig in" />

      {!manual && (
        <div className="flex flex-col gap-3 px-4 md:px-6">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek plant (bijv. hortensia, monstera, olijf)…"
              className="pl-9"
              aria-label="Zoek in catalogus"
            />
          </div>

          <ul className="flex flex-col gap-2">
            {results.map((entry) => (
              <li key={entry.id}>
                <button
                  onClick={() => selectCatalog(entry)}
                  className="w-full rounded-lg border border-border bg-bg p-3 text-left shadow-sm transition-shadow duration-fast hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start gap-3">
                    <Leaf size={20} className="mt-0.5 shrink-0 text-primary" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-fg">{entry.commonName}</p>
                      <p className="truncate text-xs italic text-muted-foreground">
                        {entry.latinName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Snoeien: {formatPruneMonths(entry.pruneMonths)}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <Button variant="outline" onClick={() => setManual(true)}>
            Handmatig invoeren
          </Button>
        </div>
      )}

      {manual && (
        <form onSubmit={save} className="flex flex-col gap-4 px-4 md:px-6">
          {selected && (
            <Card>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{selected.commonName}</p>
                  <p className="text-xs italic text-muted-foreground">{selected.latinName}</p>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(null)}>
                  Los maken
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Bijnaam / label</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Hortensia naast keukendeur"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="commonName">Plantsoort (NL)</Label>
            <Input
              id="commonName"
              value={commonName}
              onChange={(e) => setCommonName(e.target.value)}
              placeholder="bijv. Hortensia"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="latinName">Latijnse naam (optioneel)</Label>
            <Input
              id="latinName"
              value={latinName}
              onChange={(e) => setLatinName(e.target.value)}
              placeholder="bijv. Hydrangea macrophylla"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Locatie</Label>
            <div className="flex gap-2">
              {(['binnen', 'buiten'] as Location[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                    location === loc
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-bg text-muted-foreground hover:bg-muted',
                  )}
                >
                  {loc === 'binnen' ? <Sun size={16} /> : <Cloud size={16} />}
                  {loc === 'binnen' ? 'Binnen' : 'Buiten'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="room">Plek (optioneel)</Label>
            <Input
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="bijv. Woonkamer, Voortuin"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="photo">Foto (optioneel)</Label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoBlob(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notities (optioneel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Eigenaardigheden, ervaring, standplaats…"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setManual(false)}>
              Terug
            </Button>
            <Button type="submit" className="flex-1">
              Opslaan
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
