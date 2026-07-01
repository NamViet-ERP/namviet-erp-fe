import { USE_MOCK } from '../mocks';

/**
 * Fail fast when a production bundle was built or configured for mock mode.
 * Complements build-time guards in vite.config and verify-prod-env.
 */
export function assertProductionConfig(): void {
  if (!import.meta.env.PROD) return;

  if (USE_MOCK) {
    throw new Error(
      'Cấu hình production không hợp lệ: ứng dụng đang ở chế độ mock (VITE_USE_MOCK). ' +
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
