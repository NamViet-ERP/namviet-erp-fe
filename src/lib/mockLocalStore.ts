import { clone } from './mock';

export interface MockLocalStore<T> {
  readStore: () => T[];
  writeStore: (items: T[]) => void;
}

/** Persist mock entity lists in localStorage with seed fallback. */
export function createMockLocalStore<T>(storageKey: string, seed: T[]): MockLocalStore<T> {
  function readStore(): T[] {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as T[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* ignore corrupt store */
    }
    localStorage.setItem(storageKey, JSON.stringify(seed));
    return clone(seed);
  }

  function writeStore(items: T[]): void {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

  return { readStore, writeStore };
}
