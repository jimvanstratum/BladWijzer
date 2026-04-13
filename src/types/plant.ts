export type Location = 'binnen' | 'buiten';
export type Category = 'kamerplant' | 'tuinplant' | 'kruid' | 'fruit' | 'overig';
export type PruneType =
  | 'bloei-op-oud-hout'
  | 'bloei-op-nieuw-hout'
  | 'vorm-snoei'
  | 'onderhoud'
  | 'geen';

/** Eén plant in de eigen inventaris (IndexedDB). */
export interface MyPlant {
  id: string;
  name: string;
  commonName: string;
  latinName?: string;
  catalogId?: string;
  location: Location;
  room?: string;
  photo?: Blob;
  notes?: string;
  lastPrunedAt?: string; // ISO date
  addedAt: string;       // ISO date
}

/** Eén soort uit de curated catalogus (read-only JSON). */
export interface CatalogEntry {
  id: string;
  commonName: string;
  latinName: string;
  category: Category;
  locationHint: Location[];
  pruneMonths: number[]; // 1..12
  pruneType: PruneType;
  pruneNotes?: string;
  aliases?: string[];
}

export const PRUNE_TYPE_LABEL: Record<PruneType, string> = {
  'bloei-op-oud-hout': 'Bloei op oud hout',
  'bloei-op-nieuw-hout': 'Bloei op nieuw hout',
  'vorm-snoei': 'Vormsnoei',
  onderhoud: 'Onderhoudssnoei',
  geen: 'Niet snoeien',
};
