/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the C# .NET Core API (e.g. https://api.namviet.vn). */
  readonly VITE_API_BASE_URL: string;
  /** Legacy guard — must be false or unset; mock layer removed from app. */
  readonly VITE_USE_MOCK?: string;
  /** Public base path the app is served from (defaults to '/'). */
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
