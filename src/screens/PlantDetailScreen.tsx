import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Trash2, Scissors, ImageIcon } from 'lucide-react';
import { db } from '@/data/db';
import { getCatalogEntry } from '@/data/catalog';
import { formatPruneMonths, pruneStatus } from '@/lib/prune';
import { formatDateNL } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PRUNE_TYPE_LABEL } from '@/types/plant';
import { fetchPlantImages, type WikimediaImage } from '@/services/wikimedia';

export function PlantDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const plant = useLiveQuery(() => (id ? db.plants.get(id) : undefined), [id]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [refImages, setRefImages] = useState<WikimediaImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Own photo blob → object URL
  useEffect(() => {
    if (!plant?.photo) {
      setPhotoUrl(null);
      return;
    }
    const url = URL.createObjectURL(plant.photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [plant?.photo]);

  // Wikimedia reference images (also used as hero fallback)
  useEffect(() => {
    const latin = plant?.latinName;
    if (!latin) return;
    setLoadingImages(true);
    fetchPlantImages(latin, 4)
      .then(setRefImages)
      .catch(() => setRefImages([]))
      .finally(() => setLoadingImages(false));
  }, [plant?.latinName]);

  // Hero image: own photo first, else first Wikimedia result
  const heroSrc = photoUrl ?? refImages[0]?.thumbUrl ?? null;

  if (!plant) {
    return <p className="p-4 text-sm text-muted-foreground">Plant niet gevonden.</p>;
  }

  const entry = getCatalogEntry(plant.catalogId);
  const status = pruneStatus(entry);

  const markPrunedNow = async () => {
    await db.plants.update(plant.id, { lastPrunedAt: new Date().toISOString() });
  };

  const remove = async () => {
    if (!confirm(`"${plant.name}" verwijderen?`)) return;
    await db.plants.delete(plant.id);
    navigate('/', { replace: true });
  };

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-6">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft size={16} /> Terug
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={remove} aria-label="Plant verwijderen">
          <Trash2 size={16} className="text-destructive" />
        </Button>
      </div>

      <div className="px-4 md:px-6">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
          {heroSrc ? (
            <img
              src={heroSrc}
              alt={`Foto van ${plant.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon size={40} strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="font-serif text-3xl font-medium">{plant.name}</h1>
        <p className="text-base text-muted-foreground">
          {plant.commonName}
          {plant.latinName && (
            <>
              {' '}
              · <span className="italic">{plant.latinName}</span>
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge tone="neutral">{plant.location === 'binnen' ? 'Binnen' : 'Buiten'}</Badge>
          {plant.room && <Badge tone="neutral">{plant.room}</Badge>}
        </div>
      </div>

      {entry && (
        <section className="px-4 md:px-6">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-medium">Snoei-info</h2>
                <Badge tone="neutral">{PRUNE_TYPE_LABEL[entry.pruneType]}</Badge>
              </div>
              <p className="text-sm">
                <span className="font-medium">Snoeiperiode:</span>{' '}
                {formatPruneMonths(entry.pruneMonths)}
              </p>
              {entry.pruneNotes && (
                <p className="text-sm leading-relaxed text-muted-foreground">{entry.pruneNotes}</p>
              )}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Laatst gesnoeid</p>
                  <p className="text-sm">{formatDateNL(plant.lastPrunedAt)}</p>
                </div>
                <Button size="sm" onClick={markPrunedNow}>
                  <Scissors size={16} /> Nu gesnoeid
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {plant.notes && (
        <section className="px-4 md:px-6">
          <Card>
            <CardContent>
              <h2 className="mb-2 font-serif text-xl font-medium">Notities</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{plant.notes}</p>
            </CardContent>
          </Card>
        </section>
      )}

      {plant.latinName && (
        <section className="flex flex-col gap-3 px-4 md:px-6">
          <h2 className="font-serif text-xl font-medium">Referentie-foto's (Wikimedia)</h2>
          {loadingImages && <p className="text-sm text-muted-foreground">Laden…</p>}
          {!loadingImages && refImages.length === 0 && (
            <p className="text-sm text-muted-foreground">Geen afbeeldingen gevonden.</p>
          )}
          {refImages.length > 0 && (
            <ul className="grid grid-cols-2 gap-2">
              {refImages.map((img) => (
                <li key={img.title} className="aspect-square overflow-hidden rounded-md bg-muted">
                  <img
                    src={img.thumbUrl}
                    alt={img.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Afbeeldingen via Wikimedia Commons (CC-licenties).
          </p>
        </section>
      )}

      <p className="px-4 text-xs text-muted-foreground md:px-6">
        Toegevoegd op {formatDateNL(plant.addedAt)}
      </p>
    </div>
  );
}
