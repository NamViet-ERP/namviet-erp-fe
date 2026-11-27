import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHUNK_RELOAD_STORAGE_KEY,
  canReloadForChunkError,
  installVitePreloadRecovery,
  isChunkLoadError,
} from './chunkLoadRecovery';

describe('chunkLoadRecovery', () => {
  let reloadMock: ReturnType<typeof vi.fn>;
  let originalLocationDescriptor: PropertyDescriptor | undefined;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    sessionStorage.clear();
    reloadMock = vi.fn();
    originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        reload: reloadMock,
      },
    });
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    sessionStorage.clear();
    if (originalLocationDescriptor) {
      Object.defineProperty(window, 'location', originalLocationDescriptor);
    }
    vi.restoreAllMocks();
  });

  describe('isChunkLoadError', () => {
    it('detects Chrome, Safari, Firefox, Vite CSS preload, and ChunkLoadError failures', () => {
      expect(
        isChunkLoadError(
          new TypeError('Failed to fetch dynamically imported module: /assets/Orders-abc123.js'),
        ),
      ).toBe(true);
      expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);
      expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true);
      expect(
        isChunkLoadError(new Error('Unable to preload CSS for /assets/x.css')),
      ).toBe(true);

      const namedChunkError = new Error('Loading chunk 42 failed');
      namedChunkError.name = 'ChunkLoadError';
      expect(isChunkLoadError(namedChunkError)).toBe(true);
      expect(isChunkLoadError({ name: 'ChunkLoadError', message: '' })).toBe(true);
    });

    it('rejects normal application errors and non-object values', () => {
      expect(isChunkLoadError(new Error('Unexpected render crash'))).toBe(false);
      expect(isChunkLoadError(null)).toBe(false);
      expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(false);
    });
  });

  describe('installVitePreloadRecovery', () => {
    it('prevents default and reloads once on first vite:preloadError, then suppresses repeat reload within 15s', () => {
      cleanup = installVitePreloadRecovery();

      const firstEvent = Object.assign(
        new Event('vite:preloadError', { cancelable: true }),
        { payload: new Error('Failed to fetch dynamically imported module: /assets/PurchasePlansPage.js') },
      );
      window.dispatchEvent(firstEvent);

      expect(firstEvent.defaultPrevented).toBe(true);
      expect(reloadMock).toHaveBeenCalledTimes(1);
      const savedTs = sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY);
      expect(savedTs).not.toBeNull();
      expect(Number(savedTs)).toBeGreaterThan(0);

      const secondEvent = Object.assign(
        new Event('vite:preloadError', { cancelable: true }),
        { payload: new Error('Unable to preload CSS for /assets/PurchasePlansPage.css') },
      );
      window.dispatchEvent(secondEvent);

      expect(secondEvent.defaultPrevented).toBe(false);
      expect(reloadMock).toHaveBeenCalledTimes(1);
    });

    it('handles vite:preloadError without payload via the 15s reload guard', () => {
      cleanup = installVitePreloadRecovery();

      const firstEvent = new CustomEvent('vite:preloadError', { cancelable: true });
      window.dispatchEvent(firstEvent);

      expect(firstEvent.defaultPrevented).toBe(true);
      expect(reloadMock).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY)).not.toBeNull();

      const secondEvent = new CustomEvent('vite:preloadError', { cancelable: true });
      window.dispatchEvent(secondEvent);

      expect(secondEvent.defaultPrevented).toBe(false);
      expect(reloadMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('canReloadForChunkError', () => {
    it('allows reload when sessionStorage throws or holds a non-finite value', () => {
      sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, 'not-a-number');
      expect(canReloadForChunkError(100_000)).toBe(true);

      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(canReloadForChunkError(100_000)).toBe(true);
    });
  });
});
