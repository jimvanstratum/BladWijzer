import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft, Trash2, Scissors, ImageIcon, Pencil, Camera, Check, X,
  Sun, Droplets, Flower2, Shovel, AlertTriangle, ChevronDown, ExternalLink,
} from 'lucide-react';
import { db } from '@/data/db';
import { getCatalogEntry } from '@/data/catalog';
import { formatPruneMonths, pruneStatus } from '@/lib/prune';
import { formatDateNL, MONTH_NAMES_NL } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Label } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import {
  PRUNE_TYPE_LABEL,
  SUN_LIGHT_LABEL,
  WATER_NEEDS_LABEL,
  TOXICITY_LABEL,
} from '@/types/plant';
import { fetchPlantImages, type WikimediaImage } from '@/services/wikimedia';
import { fetchWikiSummary, type WikiSummary } from '@/services/wikipedia';
import { ImageLightbox, type LightboxImage } from '@/components/ui/ImageLightbox';

/* ── Helpers ─────────────────────────────────────── */

function formatMonths(months?: number[]): string {
  if (!months || months.length === 0) return '—';
  const sorted = [...months].sort((a, b) => a - b);
  return sorted.map((m) => MONTH_NAMES_NL[m - 1]).join(', ');
}

/* ── Info-sectie component ───────────────────────── */

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

/* ── Uitklapbare Wikipedia-sectie ────────────────── */

function WikiSection({ latinName }: { latinName: string }) {
  const [summary, setSummary] = useState<WikiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [fetched, setFetched] = useState(false);

  const handleOpen = () => {
    if (!fetched) {
      setLoading(true);
      fetchWikiSummary(latinName)
        .then(setSummary)
        .catch(() => setSummary(null))
        .finally(() => {
          setLoading(false);
          setFetched(true);
        });
    }
    setOpen((v) => !v);
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <button
          onClick={handleOpen}
          className="flex items-center justify-between text-left"
        >
          <h2 className="font-serif text-xl font-medium">Meer informatie</h2>
          <ChevronDown
            size={20}
            className={cn(
              'text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>
        {open && (
          <div className="flex flex-col gap-2 pt-1">
            {loading && <p className="text-sm text-muted-foreground">Laden van Wikipedia…</p>}
            {!loading && !summary && fetched && (
              <p className="text-sm text-muted-foreground">
                Geen Wikipedia-artikel gevonden voor <em>{latinName}</em>.
              </p>
            )}
            {summary && (
              <>
                <p className="text-sm leading-relaxed">{summary.extract}</p>
                <a
                  href={summary.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                >
                  Lees meer op Wikipedia <ExternalLink size={14} />
                </a>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Hoofdscherm ─────────────────────────────────── */

export function PlantDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const plant = useLiveQuery(() => (id ? db.plants.get(id) : undefined), [id]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [refImages, setRefImages] = useState<WikimediaImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPhoto, setEditPhoto] = useState<Blob | null | undefined>(undefined);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Own photo → object URL
  useEffect(() => {
    if (!plant?.photo) {
      setPhotoUrl(null);
      return;
    }
    const url = URL.createObjectURL(plant.photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [plant?.photo]);

  // Wikimedia reference images
  useEffect(() => {
    const latin = plant?.latinName;
    if (!latin) return;
    setLoadingImages(true);
    fetchPlantImages(latin, 8)
      .then(setRefImages)
      .catch(() => setRefImages([]))
      .finally(() => setLoadingImages(false));
  }, [plant?.latinName]);

  // heroImageUrl heeft voorrang als die expliciet is ingesteld
  const heroSrc = plant?.heroImageUrl ?? photoUrl ?? refImages[0]?.thumbUrl ?? null;

  // Unified image list voor lightbox
  const lightboxImages = useMemo<LightboxImage[]>(() => {
    const imgs: LightboxImage[] = [];
    if (photoUrl) {
      imgs.push({ src: photoUrl, alt: `Eigen foto van ${plant?.name ?? 'plant'}` });
    }
    refImages.forEach((img) => {
      imgs.push({ src: img.fullUrl, thumbSrc: img.thumbUrl, alt: img.title });
    });
    return imgs;
  }, [photoUrl, refImages, plant?.name]);

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

  const startEdit = () => {
    setEditName(plant.name);
    setEditRoom(plant.room ?? '');
    setEditNotes(plant.notes ?? '');
    setEditPhoto(undefined);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditPhoto(undefined);
  };

  const saveEdit = async () => {
    const updates: Record<string, unknown> = {
      name: editName.trim() || plant.name,
      room: editRoom.trim() || undefined,
      notes: editNotes.trim() || undefined,
    };
    if (editPhoto !== undefined) {
      updates.photo = editPhoto ?? undefined;
    }
    await db.plants.update(plant.id, updates);
    setEditing(false);
    setEditPhoto(undefined);
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft size={16} /> Terug
          </Link>
        </Button>
        <div className="flex gap-1">
          {!editing && (
            <Button variant="ghost" size="sm" onClick={startEdit} aria-label="Plant bewerken">
              <Pencil size={16} />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={remove} aria-label="Plant verwijderen">
            <Trash2 size={16} className="text-destructive" />
          </Button>
        </div>
      </div>

      {/* Hero image */}
      <div className="relative px-4 md:px-6">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
          {heroSrc ? (
            <button
              type="button"
              className="h-full w-full"
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
              aria-label={`Foto van ${plant.name} vergroten`}
            >
              <img
                src={heroSrc}
                alt={`Foto van ${plant.name}`}
                className="h-full w-full object-cover"
              />
            </button>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon size={40} strokeWidth={1.5} />
            </div>
          )}
        </div>
        {editing && (
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="absolute bottom-3 right-7 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
            aria-label="Foto wijzigen"
          >
            <Camera size={18} />
          </button>
        )}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setEditPhoto(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Info / edit fields */}
      {editing ? (
        <div className="flex flex-col gap-3 px-4 md:px-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Bijnaam / label</Label>
            <Input
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-room">Plek</Label>
            <Input
              id="edit-room"
              value={editRoom}
              onChange={(e) => setEditRoom(e.target.value)}
              placeholder="bijv. Woonkamer, Voortuin"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-notes">Notities</Label>
            <Textarea
              id="edit-notes"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Eigenaardigheden, ervaring, standplaats…"
            />
          </div>
          {editPhoto && (
            <p className="text-xs text-primary">
              Nieuwe foto geselecteerd. Wordt opgeslagen bij bevestigen.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={cancelEdit}>
              <X size={16} /> Annuleren
            </Button>
            <Button className="flex-1" onClick={saveEdit}>
              <Check size={16} /> Opslaan
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4 md:px-6">
          <h1 className="font-serif text-3xl font-medium">{plant.name}</h1>
          <p className="text-base text-muted-foreground">
            {plant.commonName}
            {plant.latinName && (
              <>
                {' · '}
                <span className="italic">{plant.latinName}</span>
              </>
            )}
          </p>
          {entry?.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge tone={status.tone}>{status.label}</Badge>
            <Badge tone="neutral">{plant.location === 'binnen' ? 'Binnen' : 'Buiten'}</Badge>
            {plant.room && <Badge tone="neutral">{plant.room}</Badge>}
          </div>
        </div>
      )}

      {/* ── Verzorgingsinformatie (6 icoon-secties) ── */}
      {entry && !editing && (
        <section className="px-4 md:px-6">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <h2 className="font-serif text-xl font-medium">Verzorging</h2>

              {/* ☀️ Standplaats */}
              {(entry.sunLight || entry.frostHardy !== undefined) && (
                <InfoSection icon={Sun} title="Standplaats">
                  {entry.sunLight && <p>{SUN_LIGHT_LABEL[entry.sunLight]}</p>}
                  {entry.frostHardy !== undefined && (
                    <p>{entry.frostHardy ? 'Vorstbestendig' : 'Niet vorstbestendig — beschermen in winter'}</p>
                  )}
                </InfoSection>
              )}

              {/* 💧 Water */}
              {(entry.waterNeeds || entry.waterNotes) && (
                <InfoSection icon={Droplets} title="Water">
                  {entry.waterNeeds && <p>{WATER_NEEDS_LABEL[entry.waterNeeds]}</p>}
                  {entry.waterNotes && <p>{entry.waterNotes}</p>}
                </InfoSection>
              )}

              {/* 🌸 Bloei */}
              {(entry.bloomMonths?.length || entry.bloomColor) && (
                <InfoSection icon={Flower2} title="Bloei">
                  {entry.bloomMonths && entry.bloomMonths.length > 0 && (
                    <p>Bloeiperiode: {formatMonths(entry.bloomMonths)}</p>
                  )}
                  {entry.bloomColor && <p>Kleur: {entry.bloomColor}</p>}
                </InfoSection>
              )}

              {/* ✂️ Snoei */}
              <InfoSection icon={Scissors} title="Snoei">
                <p>
                  <span className="font-medium">{PRUNE_TYPE_LABEL[entry.pruneType]}</span>
                  {entry.pruneMonths.length > 0 && (
                    <> — {formatPruneMonths(entry.pruneMonths)}</>
                  )}
                </p>
                {entry.pruneNotes && <p>{entry.pruneNotes}</p>}
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Laatst gesnoeid</p>
                    <p className="text-sm text-fg">{formatDateNL(plant.lastPrunedAt)}</p>
                  </div>
                  <Button size="sm" onClick={markPrunedNow}>
                    <Scissors size={14} /> Nu gesnoeid
                  </Button>
                </div>
              </InfoSection>

              {/* 🌱 Grond & voeding */}
              {(entry.soilType || entry.fertilizeNotes) && (
                <InfoSection icon={Shovel} title="Grond & voeding">
                  {entry.soilType && <p>{entry.soilType}</p>}
                  {entry.fertilizeNotes && <p>{entry.fertilizeNotes}</p>}
                </InfoSection>
              )}

              {/* ⚠️ Giftigheid */}
              {entry.toxicity && (
                <InfoSection icon={AlertTriangle} title="Giftigheid">
                  {entry.toxicityNotes ? (
                    <p>{entry.toxicityNotes}</p>
                  ) : (
                    <p className={cn(
                      'font-medium',
                      entry.toxicity === 'niet-giftig' ? 'text-primary' : 'text-destructive',
                    )}>
                      {TOXICITY_LABEL[entry.toxicity]}
                    </p>
                  )}
                </InfoSection>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Eigen notities */}
      {plant.notes && !editing && (
        <section className="px-4 md:px-6">
          <Card>
            <CardContent>
              <h2 className="mb-2 font-serif text-xl font-medium">Notities</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{plant.notes}</p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Wikipedia */}
      {plant.latinName && !editing && (
        <section className="px-4 md:px-6">
          <WikiSection latinName={plant.latinName} />
        </section>
      )}

      {/* Referentie-foto's */}
      {plant.latinName && !editing && (
        <section className="flex flex-col gap-3 px-4 md:px-6">
          <h2 className="font-serif text-xl font-medium">Foto's (Wikimedia)</h2>
          {loadingImages && <p className="text-sm text-muted-foreground">Laden…</p>}
          {!loadingImages && refImages.length === 0 && (
            <p className="text-sm text-muted-foreground">Geen afbeeldingen gevonden.</p>
          )}
          {refImages.length > 0 && (
            <ul className="grid grid-cols-2 gap-2">
              {refImages.map((img, i) => {
                const lbIndex = photoUrl ? i + 1 : i;
                const isHero = plant.heroImageUrl === img.thumbUrl;
                return (
                  <li key={img.title} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                    <button
                      type="button"
                      className="h-full w-full"
                      onClick={() => { setLightboxIndex(lbIndex); setLightboxOpen(true); }}
                      aria-label={`${img.title} vergroten`}
                    >
                      <img
                        src={img.thumbUrl}
                        alt={img.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </button>
                    {/* Knop om als hoofdfoto in te stellen */}
                    {!isHero && (
                      <button
                        type="button"
                        onClick={async () => {
                          await db.plants.update(plant.id, { heroImageUrl: img.thumbUrl });
                        }}
                        className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm transition-colors active:bg-black/70"
                        aria-label="Kies als hoofdfoto"
                      >
                        <ImageIcon size={12} /> Hoofdfoto
                      </button>
                    )}
                    {isHero && (
                      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">
                        <Check size={12} /> Hoofdfoto
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Afbeeldingen via Wikimedia Commons (CC-licenties).
          </p>
        </section>
      )}

      {!editing && (
        <p className="px-4 text-xs text-muted-foreground md:px-6">
          Toegevoegd op {formatDateNL(plant.addedAt)}
        </p>
      )}

      {/* Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
}
