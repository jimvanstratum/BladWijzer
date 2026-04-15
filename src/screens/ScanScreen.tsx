import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { Camera, Leaf, Loader2, AlertCircle, Check, ChevronRight } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { identifyPlant, type PlantNetResult } from '@/services/plantnet';
import { CATALOG } from '@/data/catalog';
import { db } from '@/data/db';
import { fetchPlantImages } from '@/services/wikimedia';
import type { CatalogEntry, Location, MyPlant } from '@/types/plant';
import { cn } from '@/lib/utils';

type Phase = 'capture' | 'loading' | 'results' | 'error';

/**
 * Module-level cache zodat scan-resultaten een unmount overleven.
 * Nodig omdat React Router de ScanScreen unmount zodra je naar
 * /catalog/:id navigeert; zonder cache zie je bij terugkomen weer
 * het lege capture-scherm.
 */
interface ScanCache {
  phase: Phase;
  preview: string | null;
  photoFile: File | null;
  results: PlantNetResult[];
  error: string | null;
}
let scanCache: ScanCache | null = null;

/** Try to find a matching catalog entry by Latin name */
function findCatalogMatch(latinName: string): CatalogEntry | undefined {
  const lower = latinName.toLowerCase();
  return CATALOG.find((e) => e.latinName.toLowerCase() === lower)
    ?? CATALOG.find((e) => {
      // Match op genus (eerste woord)
      const genus = lower.split(' ')[0];
      return e.latinName.toLowerCase().startsWith(genus);
    });
}

export function ScanScreen() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhaseState] = useState<Phase>(() => scanCache?.phase ?? 'capture');
  const [preview, setPreviewState] = useState<string | null>(() => scanCache?.preview ?? null);
  const [photoFile, setPhotoFileState] = useState<File | null>(() => scanCache?.photoFile ?? null);
  const [results, setResultsState] = useState<PlantNetResult[]>(() => scanCache?.results ?? []);
  const [error, setErrorState] = useState<string | null>(() => scanCache?.error ?? null);
  const [saving, setSaving] = useState<string | null>(null); // id of result being saved

  // Wrappers die de module-cache bijhouden, zodat state een unmount overleeft.
  const writeCache = (patch: Partial<ScanCache>) => {
    scanCache = {
      phase: patch.phase ?? scanCache?.phase ?? 'capture',
      preview: patch.preview !== undefined ? patch.preview : scanCache?.preview ?? null,
      photoFile: patch.photoFile !== undefined ? patch.photoFile : scanCache?.photoFile ?? null,
      results: patch.results ?? scanCache?.results ?? [],
      error: patch.error !== undefined ? patch.error : scanCache?.error ?? null,
    };
  };
  const setPhase = (v: Phase) => { setPhaseState(v); writeCache({ phase: v }); };
  const setPreview = (v: string | null) => { setPreviewState(v); writeCache({ preview: v }); };
  const setPhotoFile = (v: File | null) => { setPhotoFileState(v); writeCache({ photoFile: v }); };
  const setResults = (v: PlantNetResult[]) => { setResultsState(v); writeCache({ results: v }); };
  const setError = (v: string | null) => { setErrorState(v); writeCache({ error: v }); };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
    setPhase('loading');
    setError(null);

    try {
      const response = await identifyPlant([file]);
      if (response.results.length === 0) {
        setError('Geen plant herkend. Probeer een andere foto (bij voorkeur van een blad of bloem).');
        setPhase('error');
      } else {
        setResults(response.results);
        setPhase('results');
      }
    } catch (err) {
      setError((err as Error).message);
      setPhase('error');
    }
  };

  const addPlant = async (result: PlantNetResult) => {
    if (!photoFile) return;
    const key = result.species.scientificNameWithoutAuthor;
    setSaving(key);

    try {
      const catalogMatch = findCatalogMatch(key);
      const commonName =
        result.species.commonNames[0]
        ?? catalogMatch?.commonName
        ?? key;

      // Probeer een Wikimedia hero image te vinden
      let heroImageUrl: string | undefined;
      try {
        const imgs = await fetchPlantImages(key, 1);
        if (imgs[0]) heroImageUrl = imgs[0].thumbUrl;
      } catch { /* geen probleem */ }

      const plant: MyPlant = {
        id: uuid(),
        name: commonName,
        commonName,
        latinName: key,
        catalogId: catalogMatch?.id,
        location: (catalogMatch?.locationHint[0] ?? 'buiten') as Location,
        photo: photoFile,
        heroImageUrl,
        addedAt: new Date().toISOString(),
      };

      await db.plants.put(plant);
      // Plant toegevoegd — cache opruimen zodat volgende scan vers begint
      scanCache = null;
      navigate(`/plant/${plant.id}`, { replace: true });
    } catch {
      setSaving(null);
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPhase('capture');
    setPreview(null);
    setPhotoFile(null);
    setResults([]);
    setError(null);
    setSaving(null);
    scanCache = null;
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-4">
      <AppHeader title="Plant scannen" subtitle="Maak een foto en herken de plant" />

      {/* Camera input (verborgen) */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPhoto}
      />

      {/* FASE: Capture */}
      {phase === 'capture' && (
        <div className="flex flex-col items-center gap-6 px-4 py-8 md:px-6">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted">
            <Camera size={48} className="text-primary" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Maak een foto van een blad, bloem of de hele plant.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Hoe duidelijker het beeld, hoe beter de herkenning.
            </p>
          </div>
          <Button size="lg" onClick={() => fileRef.current?.click()} className="w-full max-w-xs">
            <Camera size={18} /> Foto maken
          </Button>
        </div>
      )}

      {/* FASE: Loading */}
      {phase === 'loading' && (
        <div className="flex flex-col items-center gap-6 px-4 py-8 md:px-6">
          {preview && (
            <img
              src={preview}
              alt="Gemaakte foto"
              className="h-48 w-48 rounded-xl object-cover shadow-md"
            />
          )}
          <div className="flex items-center gap-3 text-primary">
            <Loader2 size={24} className="animate-spin" />
            <p className="text-sm font-medium">Plant herkennen…</p>
          </div>
        </div>
      )}

      {/* FASE: Error */}
      {phase === 'error' && (
        <div className="flex flex-col items-center gap-4 px-4 py-8 md:px-6">
          {preview && (
            <img
              src={preview}
              alt="Gemaakte foto"
              className="h-48 w-48 rounded-xl object-cover shadow-md opacity-60"
            />
          )}
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>
              Opnieuw proberen
            </Button>
            <Button variant="outline" onClick={() => navigate('/add')}>
              Handmatig toevoegen
            </Button>
          </div>
        </div>
      )}

      {/* FASE: Results */}
      {phase === 'results' && (
        <div className="flex flex-col gap-4 px-4 md:px-6">
          {preview && (
            <div className="flex justify-center">
              <img
                src={preview}
                alt="Gescande foto"
                className="h-36 w-36 rounded-xl object-cover shadow-md"
              />
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? 'resultaat' : 'resultaten'} gevonden
          </p>

          <ul className="flex flex-col gap-3">
            {results.map((r) => {
              const latin = r.species.scientificNameWithoutAuthor;
              const common = r.species.commonNames[0];
              const confidence = Math.round(r.score * 100);
              const catalogMatch = findCatalogMatch(latin);
              const thumbUrl = r.images?.[0]?.url?.s;
              const isSaving = saving === latin;

              return (
                <li key={latin}>
                  <Card>
                    <CardContent className="flex items-center gap-3 py-3">
                      {/* Klikbaar gedeelte: opent catalogus detail */}
                      {catalogMatch ? (
                        <Link
                          to={`/catalog/${catalogMatch.id}`}
                          className="flex flex-1 items-center gap-3 min-w-0"
                        >
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={common ?? latin}
                              className="h-14 w-14 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <Leaf size={20} className="text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-fg">{common ?? latin}</p>
                            <p className="truncate text-xs italic text-muted-foreground">{latin}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-muted">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    confidence >= 50 ? 'bg-primary' : 'bg-amber-500',
                                  )}
                                  style={{ width: `${confidence}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">{confidence}%</span>
                            </div>
                            <p className="mt-0.5 text-xs text-primary">Bekijk in catalogus</p>
                          </div>
                          <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                        </Link>
                      ) : (
                        <div className="flex flex-1 items-center gap-3 min-w-0">
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={common ?? latin}
                              className="h-14 w-14 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <Leaf size={20} className="text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-fg">{common ?? latin}</p>
                            <p className="truncate text-xs italic text-muted-foreground">{latin}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-muted">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    confidence >= 50 ? 'bg-primary' : 'bg-amber-500',
                                  )}
                                  style={{ width: `${confidence}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">{confidence}%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Directe toevoeg-knop */}
                      <Button
                        size="sm"
                        onClick={(e) => { e.preventDefault(); addPlant(r); }}
                        disabled={isSaving || saving !== null}
                        className="shrink-0"
                      >
                        {isSaving ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={reset}>
              Opnieuw scannen
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/add')}>
              Handmatig toevoegen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
