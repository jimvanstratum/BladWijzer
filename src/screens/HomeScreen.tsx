import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Plus, Search, Leaf, ArrowUpDown } from 'lucide-react';
import { db } from '@/data/db';
import { getCatalogEntry } from '@/data/catalog';
import { PlantCard } from '@/components/PlantCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useIsDark } from '@/hooks/useIsDark';
import type { Location, MyPlant } from '@/types/plant';
import { cn, currentMonth } from '@/lib/utils';

const WORDLOGO = `${import.meta.env.BASE_URL}wordlogo.svg`;
const WORDLOGO_DARK = `${import.meta.env.BASE_URL}wordlogo-dark.svg`;

const FILTERS: Array<{ id: 'alle' | Location; label: string }> = [
  { id: 'alle', label: 'Alles' },
  { id: 'binnen', label: 'Binnen' },
  { id: 'buiten', label: 'Buiten' },
];

type SortMode = 'added' | 'prune' | 'az';

const SORTS: Array<{ id: SortMode; label: string }> = [
  { id: 'added', label: 'Toegevoegd' },
  { id: 'prune', label: 'Snoeivolgorde' },
  { id: 'az', label: 'A-Z' },
];

const SORT_KEY = 'bladwijzer-home-sort';

function loadSort(): SortMode {
  const saved = localStorage.getItem(SORT_KEY);
  return SORTS.some((s) => s.id === saved) ? (saved as SortMode) : 'added';
}

// Survives HomeScreen unmounts (e.g. opening a plant detail) within the session.
const homeState: { filter: 'alle' | Location; sort: SortMode; query: string } = {
  filter: 'alle',
  sort: loadSort(),
  query: '',
};

function pruneDistance(plant: MyPlant): number {
  const entry = getCatalogEntry(plant.catalogId);
  if (!entry || entry.pruneMonths.length === 0) return 13;
  const month = currentMonth();
  if (entry.pruneMonths.includes(month)) return 0;
  return Math.min(...entry.pruneMonths.map((m) => ((m - month + 12) % 12) || 12));
}

function sortPlants(plants: MyPlant[], mode: SortMode): MyPlant[] {
  switch (mode) {
    case 'added':
      return [...plants].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    case 'prune':
      return [...plants].sort((a, b) => pruneDistance(a) - pruneDistance(b) || a.commonName.localeCompare(b.commonName, 'nl'));
    case 'az':
      return [...plants].sort((a, b) => a.commonName.localeCompare(b.commonName, 'nl'));
  }
}

export function HomeScreen() {
  const plants = useLiveQuery(() => db.plants.toArray(), []);
  const [filter, setFilter] = useState<'alle' | Location>(() => homeState.filter);
  const [sort, setSort] = useState<SortMode>(() => homeState.sort);
  const [query, setQuery] = useState(() => homeState.query);
  const isDark = useIsDark();

  useEffect(() => {
    homeState.filter = filter;
    homeState.sort = sort;
    homeState.query = query;
    localStorage.setItem(SORT_KEY, sort);
  }, [filter, sort, query]);

  const filtered = useMemo(() => {
    if (!plants) return [];
    const q = query.trim().toLowerCase();
    const matched = plants
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
    return sortPlants(matched, sort);
  }, [plants, filter, query, sort]);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-5 md:px-6 md:py-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-fg md:text-3xl">Mijn planten</h1>
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
        <div className="flex items-center gap-2" role="tablist">
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
          <Link
            to="/add"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-fg"
            aria-label="Plant toevoegen"
          >
            <Plus size={16} />
          </Link>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="shrink-0 text-muted-foreground" />
          {SORTS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSort(id)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                sort === id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-fg',
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
