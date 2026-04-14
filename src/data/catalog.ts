import type { CatalogEntry } from '@/types/plant';
import catalog from './plants-catalog.json';

export const CATALOG = (catalog as CatalogEntry[]).sort((a, b) =>
  a.commonName.localeCompare(b.commonName, 'nl'),
);

const BY_ID = new Map(CATALOG.map((e) => [e.id, e]));

export function getCatalogEntry(id: string | undefined): CatalogEntry | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function searchCatalog(query: string, limit = 30): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return CATALOG.slice(0, limit);
  return CATALOG.filter((e) => {
    const haystack = [e.commonName, e.latinName, ...(e.aliases ?? [])]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  }).slice(0, limit);
}
