/**
 * Fail fast when a production bundle was built with mock mode.
 * Empty VITE_API_BASE_URL is allowed (same-origin reverse proxy + cookie auth).
 */
export function assertProductionConfig(): void {
  if (!import.meta.env.PROD) return;

  if (import.meta.env.VITE_USE_MOCK === 'true') {
    throw new Error(
      'Cấu hình production không hợp lệ: VITE_USE_MOCK=true. ' +
        'Build lại bằng `npm run build:prod` với VITE_USE_MOCK=false.',
    );
  }
}
