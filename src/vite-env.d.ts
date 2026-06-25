/// <reference types="vite/client" />

/** Compile-time mock flag injected by Vite `define` (see vite.config.ts). */
declare const __USE_MOCK__: boolean;

interface ImportMetaEnv {
  /** Base URL of the C# .NET Core API (e.g. https://api.namviet.vn). */
  readonly VITE_API_BASE_URL: string;
  /** When 'true', the data layer serves bundled mock data instead of calling the API. */
  readonly VITE_USE_MOCK: string;
  /** Public base path the app is served from (defaults to '/'). */
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
