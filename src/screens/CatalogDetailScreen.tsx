import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import {
  ArrowLeft, Plus, Sun, Droplets, Flower2, Shovel, AlertTriangle, Scissors,
} from 'lucide-react';
import { getCatalogEntry } from '@/data/catalog';
import { db } from '@/data/db';
import { formatPruneMonths, pruneStatus } from '@/lib/prune';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  PRUNE_TYPE_LABEL,
  SUN_LIGHT_LABEL,
  WATER_NEEDS_LABEL,
  TOXICITY_LABEL,
} from '@/types/plant';
import type { Location, MyPlant } from '@/types/plant';
import { fetchPlantImages, type WikimediaImage } from '@/services/wikimedia';
import { fetchWikiSummary, type WikiSummary } from '@/services/wikipedia';
import { ImageLightbox, type LightboxImage } from '@/components/ui/ImageLightbox';

const MONTH_NAMES_NL = [
  'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
];

function formatMonths(months?: number[]): string {
  if (!months || months.length === 0) return '—';
  const sorted = [...months].sort((a, b) => a - b);
  return sorted.map((m) => MONTH_NAMES_NL[m - 1]).join(', ');
}

function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Sun;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        <div className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export function CatalogDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const entry = getCatalogEntry(id);

  const [refImages, setRefImages] = useState<WikimediaImage[]>([]);
  const [wikiSummary, setWikiSummary] = useState<WikiSummary | null>(null);
  const [saving, setSaving] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Wikimedia images
  useEffect(() => {
    if (!entry?.latinName) return;
    let cancelled = false;
    fetchPlantImages(entry.latinName, 8).then((imgs) => {
      if (!cancelled) setRefImages(imgs);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [entry?.latinName]);

  // Wikipedia summary
  useEffect(() => {
    if (!entry?.latinName) return;
    let cancelled = false;
    fetchWikiSummary(entry.latinName).then((s) => {
      if (!cancelled) setWikiSummary(s);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [entry?.latinName]);

  if (!entry) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">Plant niet gevonden in catalogus.</p>
        <Button asChild variant="outline">
          <Link to="/catalog">Terug naar catalogus</Link>
        </Button>
      </div>
    );
  }

  const status = pruneStatus(entry);
  const heroSrc = refImages[0]?.thumbUrl ?? null;

  const lightboxImages: LightboxImage[] = refImages.map((img) => ({
    src: img.fullUrl ?? img.thumbUrl,
    alt: img.title ?? entry.commonName,
  }));

  const addToCollection = async () => {
    setSaving(true);
    try {
      const plant: MyPlant = {
        id: uuid(),
        name: entry.commonName,
        commonName: entry.commonName,
        latinName: entry.latinName,
        catalogId: entry.id,
        location: entry.locationHint[0] ?? 'buiten' as Location,
        heroImageUrl: heroSrc ?? undefined,
        addedAt: new Date().toISOString(),
      };
      await db.plants.put(plant);
      navigate(`/plant/${plant.id}`, { replace: true });
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-4">
      {/* Header met hero image */}
      <div className="relative">
        {heroSrc ? (
          <button
            onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
            className="block w-full"
          >
            <img
              src={heroSrc}
              alt={`Foto van ${entry.commonName}`}
              className="aspect-[16/9] w-full object-cover"
            />
          </button>
        ) : (
          <div className="aspect-[16/9] w-full bg-muted" />
        )}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-bg/80 text-fg backdrop-blur-sm shadow-sm"
          aria-label="Terug"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* Titel */}
      <div className="px-4 md:px-6">
        <h1 className="font-serif text-2xl font-medium text-fg">{entry.commonName}</h1>
        <p className="text-sm italic text-muted-foreground">{entry.latinName}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge tone="neutral">{entry.category}</Badge>
          {entry.locationHint.map((loc) => (
            <Badge key={loc} tone="neutral">{loc === 'binnen' ? 'Binnen' : 'Buiten'}</Badge>
          ))}
        </div>
      </div>

      {/* Toevoegen knop */}
      <div className="px-4 md:px-6">
        <Button onClick={addToCollection} disabled={saving} className="w-full" size="lg">
          <Plus size={18} />
          {saving ? 'Toevoegen…' : 'Toevoegen aan mijn planten'}
        </Button>
      </div>

      {/* Beschrijving */}
      {(entry.description || wikiSummary?.extract) && (
        <div className="px-4 md:px-6">
          <Card>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {entry.description || wikiSummary?.extract}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info secties */}
      <div className="flex flex-col gap-4 px-4 md:px-6">
        {/* Snoeien */}
        <Card>
          <CardContent className="flex flex-col gap-3">
            <InfoSection icon={Scissors} title="Snoeien">
              <p><strong>Type:</strong> {PRUNE_TYPE_LABEL[entry.pruneType]}</p>
              <p><strong>Periode:</strong> {formatPruneMonths(entry.pruneMonths)}</p>
              {entry.pruneNotes && <p className="mt-1">{entry.pruneNotes}</p>}
            </InfoSection>
          </CardContent>
        </Card>

        {/* Standplaats */}
        {entry.sunLight && (
          <Card>
            <CardContent>
              <InfoSection icon={Sun} title="Standplaats">
                <p>{SUN_LIGHT_LABEL[entry.sunLight]}</p>
                {entry.frostHardy !== undefined && (
                  <p>{entry.frostHardy ? 'Vorstbestendig' : 'Niet vorstbestendig'}</p>
                )}
              </InfoSection>
            </CardContent>
          </Card>
        )}

        {/* Water */}
        {entry.waterNeeds && (
          <Card>
            <CardContent>
              <InfoSection icon={Droplets} title="Water">
                <p>{entry.waterNotes || WATER_NEEDS_LABEL[entry.waterNeeds]}</p>
              </InfoSection>
            </CardContent>
          </Card>
        )}

        {/* Bloei */}
        {entry.bloomMonths && entry.bloomMonths.length > 0 && (
          <Card>
            <CardContent>
              <InfoSection icon={Flower2} title="Bloei">
                <p>{formatMonths(entry.bloomMonths)}</p>
                {entry.bloomColor && <p>Kleur: {entry.bloomColor}</p>}
              </InfoSection>
            </CardContent>
          </Card>
        )}

        {/* Grond & voeding */}
        {(entry.soilType || entry.fertilizeNotes) && (
          <Card>
            <CardContent>
              <InfoSection icon={Shovel} title="Grond & voeding">
                {entry.soilType && <p>{entry.soilType}</p>}
                {entry.fertilizeNotes && <p>{entry.fertilizeNotes}</p>}
              </InfoSection>
            </CardContent>
          </Card>
        )}

        {/* Giftigheid */}
        {entry.toxicity && (
          <Card>
            <CardContent>
              <InfoSection icon={AlertTriangle} title="Giftigheid">
                <p>{entry.toxicityNotes || TOXICITY_LABEL[entry.toxicity]}</p>
              </InfoSection>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Wikimedia afbeeldingen grid */}
      {refImages.length > 1 && (
        <div className="px-4 md:px-6">
          <h2 className="mb-2 font-serif text-lg font-medium text-fg">Afbeeldingen</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {refImages.map((img, i) => (
              <button
                key={img.thumbUrl}
                onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                className="relative aspect-square overflow-hidden rounded-lg"
              >
                <img
                  src={img.thumbUrl}
                  alt={img.title ?? entry.commonName}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}
    </div>
  );
}
