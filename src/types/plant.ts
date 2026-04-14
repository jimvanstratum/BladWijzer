export type Location = 'binnen' | 'buiten';
export type Category = 'kamerplant' | 'tuinplant' | 'kruid' | 'fruit' | 'overig';
export type PruneType =
  | 'bloei-op-oud-hout'
  | 'bloei-op-nieuw-hout'
  | 'vorm-snoei'
  | 'onderhoud'
  | 'geen';

export type SunLight = 'vol-zon' | 'halfschaduw' | 'schaduw' | 'vol-zon-halfschaduw' | 'halfschaduw-schaduw';
export type WaterNeeds = 'weinig' | 'matig' | 'veel';
export type Toxicity = 'niet-giftig' | 'licht-giftig' | 'giftig' | 'zeer-giftig';

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

  // Snoei
  pruneMonths: number[];   // 1..12
  pruneType: PruneType;
  pruneNotes?: string;

  // Standplaats
  sunLight?: SunLight;
  frostHardy?: boolean;    // vorstbestendig

  // Water
  waterNeeds?: WaterNeeds;
  waterNotes?: string;     // bijv. "Laat de grond opdrogen tussen beurten"

  // Bloei
  bloomMonths?: number[];  // 1..12
  bloomColor?: string;     // bijv. "roze, wit"

  // Grond & voeding
  soilType?: string;       // bijv. "humusrijk, goed doorlatend"
  fertilizeNotes?: string; // bijv. "Bemest maandelijks in het groeiseizoen"

  // Giftigheid
  toxicity?: Toxicity;
  toxicityNotes?: string;  // bijv. "Giftig voor katten en honden"

  // Beschrijving
  description?: string;    // korte NL-beschrijving (2-3 zinnen)

  // Zoek
  aliases?: string[];
}

export const PRUNE_TYPE_LABEL: Record<PruneType, string> = {
  'bloei-op-oud-hout': 'Bloei op oud hout',
  'bloei-op-nieuw-hout': 'Bloei op nieuw hout',
  'vorm-snoei': 'Vormsnoei',
  onderhoud: 'Onderhoudssnoei',
  geen: 'Niet snoeien',
};

export const SUN_LIGHT_LABEL: Record<SunLight, string> = {
  'vol-zon': 'Volle zon',
  'halfschaduw': 'Halfschaduw',
  'schaduw': 'Schaduw',
  'vol-zon-halfschaduw': 'Zon tot halfschaduw',
  'halfschaduw-schaduw': 'Halfschaduw tot schaduw',
};

export const WATER_NEEDS_LABEL: Record<WaterNeeds, string> = {
  weinig: 'Weinig water',
  matig: 'Matig water',
  veel: 'Veel water',
};

export const TOXICITY_LABEL: Record<Toxicity, string> = {
  'niet-giftig': 'Niet giftig',
  'licht-giftig': 'Licht giftig',
  'giftig': 'Giftig',
  'zeer-giftig': 'Zeer giftig',
};
