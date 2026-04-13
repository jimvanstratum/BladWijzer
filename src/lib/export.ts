import { db } from '@/data/db';
import type { MyPlant } from '@/types/plant';

const LAST_BACKUP_KEY = 'bladwijzer-last-backup';

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

async function buildBackup(): Promise<{ blob: Blob; filename: string }> {
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
  const filename = `bladwijzer-backup-${new Date().toISOString().slice(0, 10)}.json`;
  return { blob, filename };
}

function markBackupDone() {
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
}

export async function exportBackup(): Promise<void> {
  const { blob, filename } = await buildBackup();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  markBackupDone();
}

/** Share backup via Web Share API (iOS Notes / Mail / iCloud Drive / Android share sheet). */
export async function shareBackup(): Promise<boolean> {
  const { blob, filename } = await buildBackup();
  const file = new File([blob], filename, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: 'BladWijzer backup',
        text: 'Backup van mijn planten',
      });
      markBackupDone();
      return true;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return false;
      throw err;
    }
  }
  // Fallback: normal download
  await exportBackup();
  return true;
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

export function daysSinceLastBackup(): number | null {
  const iso = localStorage.getItem(LAST_BACKUP_KEY);
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
