/**
 * Mock-mode helpers. When `VITE_USE_MOCK === 'true'` (default in dev), the
 * domain services serve bundled data from `src/data/*` instead of calling the
 * API — so the app runs with no backend. Flip the env var to hit the real API.
 */

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/** Simulate network latency so loading states are exercised in mock mode. */
export function mockDelay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(clone(value)), ms));
}

/** Deep clone so mock callers can't mutate the shared seed arrays. */
export function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Generate a pseudo-unique id for newly created mock records. */
export function mockId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
