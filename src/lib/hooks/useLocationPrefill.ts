import { useLocation } from 'react-router-dom';

/** Read one-time navigation state (e.g. projectCode from project detail). */
export function useLocationPrefill<T extends Record<string, string>>(keys: (keyof T)[]): Partial<T> {
  const location = useLocation();
  const state = (location.state ?? {}) as Partial<T>;
  const result: Partial<T> = {};
  for (const key of keys) {
    const value = state[key];
    if (typeof value === 'string' && value.trim()) {
      result[key] = value as T[keyof T];
    }
  }
  return result;
}

/** Stable key so child state resets when navigation entry changes. */
export function useNavigationKey(): string {
  return useLocation().key;
}
