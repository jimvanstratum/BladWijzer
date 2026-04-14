/**
 * Pl@ntNet Identify API — free tier (500 requests/day).
 * Docs: https://my.plantnet.org/doc
 */

const API_BASE = 'https://my-api.plantnet.org/v2/identify/all';
const STORAGE_KEY = 'bladwijzer-plantnet-key';
const DEFAULT_KEY = '2b10eCrqhJqiUeZU7vP5QFSQ8u';

export function getApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_KEY;
}

export function setApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key);
}

export type Organ = 'leaf' | 'flower' | 'fruit' | 'bark' | 'auto';

export interface PlantNetResult {
  score: number; // 0..1
  species: {
    scientificNameWithoutAuthor: string;
    scientificName: string;
    genus: { scientificName: string };
    family: { scientificName: string };
    commonNames: string[];
  };
  images: Array<{
    url: { o: string; m: string; s: string };
  }>;
}

export interface PlantNetResponse {
  query: { project: string; images: string[] };
  language: string;
  preferedReferential: string;
  results: PlantNetResult[];
  remainingIdentificationRequests: number;
}

/**
 * Identify a plant from one or more images.
 * Returns top results sorted by confidence.
 */
export async function identifyPlant(
  images: File[],
  organs?: Organ[],
): Promise<PlantNetResponse> {
  const key = getApiKey();
  if (!key) throw new Error('Geen Pl@ntNet API-key ingesteld.');

  const url = new URL(API_BASE);
  url.searchParams.set('api-key', key);
  url.searchParams.set('nb-results', '5');
  url.searchParams.set('lang', 'nl');

  const formData = new FormData();
  images.forEach((img, i) => {
    formData.append('images', img);
    formData.append('organs', organs?.[i] ?? 'auto');
  });

  const res = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    // Probeer response body te lezen voor meer detail
    let detail = '';
    try {
      const body = await res.json();
      detail = body.message || body.error || '';
    } catch { /* ignore */ }

    if (res.status === 401 || res.status === 403) {
      throw new Error(`API-key fout (${res.status}): ${detail || 'Controleer je Pl@ntNet key.'}`);
    }
    if (res.status === 429) throw new Error('Daglimiet bereikt (500 scans/dag).');
    if (res.status === 404) throw new Error('Geen plant herkend in deze foto. Probeer een duidelijker beeld.');
    throw new Error(`Pl@ntNet fout ${res.status}: ${detail}`);
  }

  return res.json();
}
