import { db } from '@/data/db';
import type { MyPlant } from '@/types/plant';

interface SerializedPlant extends Omit<MyPlant, 'photo'> {
  photoBase64?: string;
  photoMime?: string;
}

interface Backup {
  app: 'BladWijzer';
  version: 1;
  exportedAt: string;
  plants: SerializedPlant[];
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mime: string): Blob {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function exportBackup(): Promise<void> {
  const plants = await db.plants.toArray();
  const serialized: SerializedPlant[] = await Promise.all(
    plants.map(async ({ photo, ...rest }) => ({
      ...rest,
      photoBase64: photo ? await blobToBase64(photo) : undefined,
      photoMime: photo?.type,
    })),
  );
  const backup: Backup = {
    app: 'BladWijzer',
    version: 1,
    exportedAt: new Date().toISOString(),
    plants: serialized,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `bladwijzer-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File, mode: 'replace' | 'merge'): Promise<number> {
  const text = await file.text();
  const data = JSON.parse(text) as Backup;
  if (data.app !== 'BladWijzer') throw new Error('Geen BladWijzer-backup.');

  const plants: MyPlant[] = data.plants.map(({ photoBase64, photoMime, ...rest }) => ({
    ...rest,
    photo: photoBase64 && photoMime ? base64ToBlob(photoBase64, photoMime) : undefined,
  }));

  if (mode === 'replace') {
    await db.plants.clear();
  }
  await db.plants.bulkPut(plants);
  return plants.length;
}
