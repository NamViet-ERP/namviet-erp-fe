export const CHUNK_RELOAD_STORAGE_KEY = 'nv-chunk-reload-ts';
export const CHUNK_RELOAD_WINDOW_MS = 15_000;

const CHUNK_LOAD_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Loading (?:CSS )?chunk .* failed|ChunkLoadError/i;

/** Returns true when an error indicates a stale or failed JS/CSS chunk load. */
export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as { message?: unknown; name?: unknown };
  const message = typeof record.message === 'string' ? record.message : '';
  const name = typeof record.name === 'string' ? record.name : '';
  return CHUNK_LOAD_ERROR_PATTERN.test(message) || CHUNK_LOAD_ERROR_PATTERN.test(name);
}

/** Prevents infinite reload loops by enforcing a cooldown window via sessionStorage. */
export function canReloadForChunkError(now = Date.now()): boolean {
  let prev: string | null;
  try {
    prev = sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY);
  } catch {
    return true;
  }
  if (!prev) return true;
  const prevTs = Number(prev);
  return !Number.isFinite(prevTs) || now - prevTs > CHUNK_RELOAD_WINDOW_MS;
}

/** Reloads the page once within the cooldown window when a chunk-load error occurs. */
export function tryReloadForChunkError(error: unknown, now = Date.now()): boolean {
  if (typeof window === 'undefined' || !isChunkLoadError(error) || !canReloadForChunkError(now)) {
    return false;
  }
  try {
    sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, String(now));
  } catch {
    // Ignore sessionStorage write errors in restricted browser contexts
  }
  window.location.reload();
  return true;
}

/** Subscribes to Vite preload failures so stale deployments recover seamlessly before crashing. */
export function installVitePreloadRecovery(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    const rawPayload =
      (event as Event & { payload?: unknown }).payload ?? (event as CustomEvent).detail;
    // Vite emits vite:preloadError exclusively for dynamic import or CSS preload failures;
    // normalize non-matching or missing payloads so every preload error respects the 15s guard.
    const error = isChunkLoadError(rawPayload)
      ? rawPayload
      : new Error('vite:preloadError Failed to fetch dynamically imported module');

    if (tryReloadForChunkError(error)) {
      event.preventDefault();
    }
  };

  window.addEventListener('vite:preloadError', handler);
  return () => window.removeEventListener('vite:preloadError', handler);
}
