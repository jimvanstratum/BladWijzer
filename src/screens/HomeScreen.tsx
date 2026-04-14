import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Plus, Search, Leaf } from 'lucide-react';
import { db } from '@/data/db';
import { PlantCard } from '@/components/PlantCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useIsDark } from '@/hooks/useIsDark';
import type { Location } from '@/types/plant';
import { cn } from '@/lib/utils';

const WORDLOGO = `${import.meta.env.BASE_URL}wordlogo.svg`;
const WORDLOGO_DARK = `${import.meta.env.BASE_URL}wordlogo-dark.svg`;

const FILTERS: Array<{ id: 'alle' | Location; label: string }> = [
  { id: 'alle', label: 'Alles' },
  { id: 'binnen', label: 'Binnen' },
  { id: 'buiten', label: 'Buiten' },
];

export function HomeScreen() {
  const plants = useLiveQuery(() => db.plants.orderBy('addedAt').reverse().toArray(), []);
  const [filter, setFilter] = useState<'alle' | Location>('alle');
  const [query, setQuery] = useState('');
  const isDark = useIsDark();

  const filtered = useMemo(() => {
    if (!plants) return [];
    const q = query.trim().toLowerCase();
    return plants
      .filter((p) => filter === 'alle' || p.location === filter)
      .filter((p) =>
        !q
          ? true
          : [p.name, p.commonName, p.latinName, p.room]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(q),
      );
  }, [plants, filter, query]);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-5 md:px-6 md:py-6">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-medium text-fg md:text-3xl">Mijn planten</h1>
            <Link
              to="/add"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-fg"
              aria-label="Plant toevoegen"
            >
              <Plus size={14} />
            </Link>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {plants?.length
              ? `${plants.length} ${plants.length === 1 ? 'plant' : 'planten'} in je collectie`
              : 'Voeg je eerste plant toe'}
          </p>
        </div>
        <img
          src={isDark ? WORDLOGO_DARK : WORDLOGO}
          alt="BladWijzer"
          className="h-12 w-auto shrink-0 rounded-lg md:h-16"
        />
      </header>

      <div className="flex flex-col gap-3 px-4 md:px-6">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek in je planten…"
            className="pl-9"
            aria-label="Zoek in eigen planten"
          />
        </div>
        <div className="flex gap-2" role="tablist">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                filter === id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6">
        {!plants && <p className="text-sm text-muted-foreground">Laden…</p>}

        {plants && plants.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-12 text-center">
            <Leaf size={32} className="text-muted-foreground" />
            <div>
              <p className="font-medium text-fg">Nog geen planten</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Voeg je eerste plant toe om te beginnen.
              </p>
            </div>
            <Button asChild>
              <Link to="/add">
                <Plus size={16} /> Eerste plant toevoegen
              </Link>
            </Button>
          </div>
        )}

        {plants && plants.length > 0 && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Geen planten gevonden.</p>
        )}

        {filtered.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((plant) => (
              <li key={plant.id}>
                <PlantCard plant={plant} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
