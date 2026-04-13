const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

export interface WikimediaImage {
  title: string;
  thumbUrl: string;
  fullUrl: string;
}

/** Zoekt afbeeldingen in Wikimedia Commons op Latijnse plant-naam. */
export async function fetchPlantImages(latinName: string, limit = 6): Promise<WikimediaImage[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `${latinName} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '480',
  });
  const res = await fetch(`${COMMONS_API}?${params.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { title: string; imageinfo?: { thumburl?: string; url?: string }[] }> };
  };
  const pages = data.query?.pages ?? {};
  return Object.values(pages)
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info?.url) return null;
      return {
        title: p.title,
        thumbUrl: info.thumburl ?? info.url,
        fullUrl: info.url,
      } satisfies WikimediaImage;
    })
    .filter((x): x is WikimediaImage => Boolean(x));
}
