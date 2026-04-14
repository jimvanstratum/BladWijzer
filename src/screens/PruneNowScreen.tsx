import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { db } from '@/data/db';
import { getCatalogEntry } from '@/data/catalog';
import { isPruneMonth } from '@/lib/prune';
import { MONTH_NAMES_NL, currentMonth, formatDateNL } from '@/lib/utils';
import { AppHeader } from '@/components/AppHeader';
import { PlantCard } from '@/components/PlantCard';

export function PruneNowScreen() {
  const plants = useLiveQuery(() => db.plants.toArray(), []);
  const month = currentMonth();

  const toPrune = (plants ?? []).filter((p) => {
    const entry = getCatalogEntry(p.catalogId);
    return isPruneMonth(entry, month);
  });

  return (
    <div className="flex flex-col gap-4 pb-28 md:pb-6">
      <AppHeader
        title="Snoeien deze maand"
        subtitle={`Planten die in ${MONTH_NAMES_NL[month - 1]} gesnoeid mogen worden`}
      />

      <div className="px-4 md:px-6">
        {!plants && <p className="text-sm text-muted-foreground">Laden…</p>}

        {plants && toPrune.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
            <Scissors size={32} className="text-muted-foreground" />
            <div>
              <p className="font-medium text-fg">Niets te snoeien deze maand</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Geniet van je planten — tot volgende maand.
              </p>
            </div>
          </div>
        )}

        {toPrune.length > 0 && (
          <>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {toPrune.map((p) => (
                <li key={p.id}>
                  <PlantCard plant={p} />
                </li>
              ))}
            </ul>

            <section className="mt-6 rounded-lg border border-border bg-muted p-4">
              <h2 className="mb-2 font-serif text-lg font-medium">Overzicht</h2>
              <ul className="flex flex-col gap-1 text-sm">
                {toPrune.map((p) => (
                  <li key={p.id}>
                    <Link to={`/plant/${p.id}`} className="underline-offset-2 hover:underline">
                      <strong>{p.name}</strong>
                    </Link>
                    {' — '}
                    <span className="text-muted-foreground">
                      laatst: {formatDateNL(p.lastPrunedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
