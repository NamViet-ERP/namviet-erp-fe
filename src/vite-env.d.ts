/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the C# .NET Core API (e.g. https://api.namviet.vn). */
  readonly VITE_API_BASE_URL: string;
  /** Public base path the app is served from (defaults to '/'). */
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
