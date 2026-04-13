import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';
import type { MyPlant } from '@/types/plant';
import { getCatalogEntry } from '@/data/catalog';
import { pruneStatus } from '@/lib/prune';
import { Badge } from '@/components/ui/Badge';

interface Props {
  plant: MyPlant;
}

export function PlantCard({ plant }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!plant.photo) {
      setPhotoUrl(null);
      return;
    }
    const url = URL.createObjectURL(plant.photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [plant.photo]);

  const entry = getCatalogEntry(plant.catalogId);
  const status = pruneStatus(entry);

  return (
    <Link
      to={`/plant/${plant.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-bg shadow-sm transition-shadow duration-fast hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="aspect-square w-full bg-muted">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Foto van ${plant.name}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Leaf size={32} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="truncate text-sm font-medium text-fg">{plant.name}</h3>
        {plant.latinName && (
          <p className="truncate text-xs italic text-muted-foreground">{plant.latinName}</p>
        )}
        <div className="mt-1">
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      </div>
    </Link>
  );
}
