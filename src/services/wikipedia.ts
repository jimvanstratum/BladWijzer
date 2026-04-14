/**
 * Haalt een korte beschrijving op van Wikipedia (NL, met EN fallback).
 * Gebruikt de REST API — geen API-key nodig.
 */

const WIKI_REST = (lang: string) =>
  `https://${lang}.wikipedia.org/api/rest_v1/page/summary`;

export interface WikiSummary {
  title: string;
  extract: string; // platte tekst (geen HTML)
  thumbnailUrl?: string;
  pageUrl: string;
}

/**
 * Zoekt eerst op NL Wikipedia, daarna EN als fallback.
 * Zoekt op Latijnse naam (betrouwbaarder dan NL naam).
 */
export async function fetchWikiSummary(
  latinName: string,
): Promise<WikiSummary | null> {
  // Probeer NL eerst
  const nl = await tryFetch(latinName, 'nl');
  if (nl) return nl;

  // Fallback naar EN
  const en = await tryFetch(latinName, 'en');
  return en;
}

async function tryFetch(
  title: string,
  lang: string,
): Promise<WikiSummary | null> {
  try {
    const encoded = encodeURIComponent(title.replace(/ /g, '_'));
    const res = await fetch(`${WIKI_REST(lang)}/${encoded}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      type?: string;
      title?: string;
      extract?: string;
      thumbnail?: { source?: string };
      content_urls?: { desktop?: { page?: string } };
    };
    // 'disambiguation' of 'not-found' pagina's overslaan
    if (!data.extract || data.type === 'disambiguation') return null;

    return {
      title: data.title ?? title,
      extract: data.extract,
      thumbnailUrl: data.thumbnail?.source,
      pageUrl: data.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encoded}`,
    };
  } catch {
    return null;
  }
}
