/**
 * Mock mode flag.
 * - VITE_USE_MOCK=true → serve bundled mock data (local dev without backend)
 * - VITE_USE_MOCK=false or unset → call the real API at VITE_API_BASE_URL
 *
 * `__USE_MOCK__` is inlined at build time so dead mock branches can be tree-shaken.
 */
export const USE_MOCK =
  typeof __USE_MOCK__ !== 'undefined' ? __USE_MOCK__ : import.meta.env.VITE_USE_MOCK === 'true';
