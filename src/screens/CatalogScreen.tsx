import { useMemo, useState } from 'react';
import { Search, Leaf } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { CATALOG, searchCatalog } from '@/data/catalog';
import { formatPruneMonths } from '@/lib/prune';
import type { Category } from '@/types/plant';
import { cn } from '@/lib/utils';

const CATEGORIES: Array<{ id: 'alle' | Category; label: string }> = [
  { id: 'alle', label: 'Alle' },
  { id: 'tuinplant', label: 'Tuinplanten' },
  { id: 'kamerplant', label: 'Kamerplanten' },
  { id: 'kruid', label: 'Kruiden' },
  { id: 'fruit', label: 'Fruit' },
];

export function CatalogScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'alle' | Category>('alle');

  const results = useMemo(() => {
    const base = query.trim() ? searchCatalog(query, 500) : CATALOG;
    return base.filter((e) => category === 'alle' || e.category === category);
  }, [query, category]);

  return (
    <div className="flex flex-col gap-4 pb-16 md:pb-6">
      <AppHeader title="Catalogus" subtitle={`${CATALOG.length} soorten met snoei-informatie`} />

      <div className="flex flex-col gap-3 px-4 md:px-6">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek in catalogus…"
            className="pl-9"
            aria-label="Zoek in catalogus"
          />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
          {CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setCategory(id)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                category === id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-2 overflow-hidden px-4 md:px-6">
        {results.map((entry) => (
          <li
            key={entry.id}
            className="rounded-lg border border-border bg-bg p-3 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Leaf size={20} className="mt-0.5 shrink-0 text-primary" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-fg">{entry.commonName}</p>
                    <p className="truncate text-xs italic text-muted-foreground">
                      {entry.latinName}
                    </p>
                  </div>
                  <Badge tone="neutral" className="shrink-0">{entry.category}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Snoeien: {formatPruneMonths(entry.pruneMonths)}
                </p>
              </div>
            </div>
          </li>
        ))}
        {results.length === 0 && (
          <li className="py-8 text-center text-sm text-muted-foreground">Niets gevonden.</li>
        )}
      </ul>
    </div>
  );
}
