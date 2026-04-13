import Dexie, { type Table } from 'dexie';
import type { MyPlant } from '@/types/plant';

export interface ImageCacheEntry {
  url: string;
  blob: Blob;
  fetchedAt: string;
}

export interface DescriptionCacheEntry {
  latinName: string;
  text: string;
  fetchedAt: string;
}

class BladWijzerDB extends Dexie {
  plants!: Table<MyPlant, string>;
  imageCache!: Table<ImageCacheEntry, string>;
  descriptionCache!: Table<DescriptionCacheEntry, string>;

  constructor() {
    super('bladwijzer');
    this.version(1).stores({
      plants: 'id, location, addedAt',
      imageCache: 'url, fetchedAt',
      descriptionCache: 'latinName, fetchedAt',
    });
  }
}

export const db = new BladWijzerDB();
