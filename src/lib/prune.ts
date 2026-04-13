import { MONTH_NAMES_NL, currentMonth } from '@/lib/utils';
import type { CatalogEntry } from '@/types/plant';

export function isPruneMonth(entry: CatalogEntry | undefined, month = currentMonth()): boolean {
  if (!entry) return false;
  return entry.pruneMonths.includes(month);
}

export function formatPruneMonths(months: number[]): string {
  if (months.length === 0) return 'Niet snoeien';
  const sorted = [...months].sort((a, b) => a - b);
  return sorted.map((m) => MONTH_NAMES_NL[m - 1]).join(', ');
}

export function pruneStatus(entry: CatalogEntry | undefined): {
  label: string;
  tone: 'now' | 'later' | 'none';
} {
  if (!entry || entry.pruneType === 'geen' || entry.pruneMonths.length === 0) {
    return { label: 'Geen snoei nodig', tone: 'none' };
  }
  if (isPruneMonth(entry)) {
    return { label: 'Mag nu gesnoeid', tone: 'now' };
  }
  const month = currentMonth();
  const next = [...entry.pruneMonths].sort((a, b) => {
    const da = (a - month + 12) % 12 || 12;
    const db = (b - month + 12) % 12 || 12;
    return da - db;
  })[0];
  return { label: `Snoeien in ${MONTH_NAMES_NL[next - 1]}`, tone: 'later' };
}
