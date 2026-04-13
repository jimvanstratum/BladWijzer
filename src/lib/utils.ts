import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MONTH_NAMES_NL = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
] as const;

export function formatDateNL(iso?: string): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long' }).format(new Date(iso));
}

export function currentMonth(): number {
  return new Date().getMonth() + 1;
}
