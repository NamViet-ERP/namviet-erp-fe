/**
 * Fail fast when a production bundle was built or configured without API URL.
 * Complements build-time guards in vite.config and verify-prod-env.
 */
export function assertProductionConfig(): void {
  if (!import.meta.env.PROD) return;

  if (import.meta.env.VITE_USE_MOCK === 'true') {
    throw new Error(
      'Cấu hình production không hợp lệ: VITE_USE_MOCK=true. ' +
        'Build lại bằng `npm run build:prod` với VITE_USE_MOCK=false và VITE_API_BASE_URL trỏ API thật.',
    );
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!apiBase) {
    throw new Error(
      'Cấu hình production không hợp lệ: thiếu VITE_API_BASE_URL. ' +
        'Build lại với URL API backend trong .env.production.',
    );
  }
}
