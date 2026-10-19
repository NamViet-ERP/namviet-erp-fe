/**
 * Trạng thái "phiên hết hạn" dùng chung giữa apiClient (phát hiện 401 không
 * refresh được) và SessionExpiredDialog (đăng nhập lại tại chỗ).
 *
 * Mục tiêu: KHÔNG điều hướng cứng về /login khi hết phiên để user không mất
 * form đang nhập dở. Dialog chỉ mở một lần (singleton) dù nhiều request 401
 * đồng thời cùng báo hết phiên.
 */

let expired = false;
let lastResolvedAt = 0;
const RESOLVE_COOLDOWN_MS = 4_000;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(listener => listener());
}

/** apiClient gọi khi refresh token thất bại hẳn — mở dialog (idempotent). */
export function notifySessionExpired(): void {
  if (expired) return;
  // Bỏ qua các request 401 trễ đang bay dở ngay sau khi vừa đăng nhập lại thành công
  if (Date.now() - lastResolvedAt < RESOLVE_COOLDOWN_MS) return;
  expired = true;
  emit();
}

/** Đăng nhập lại thành công (hoặc user chủ động đóng) — đóng dialog. */
export function resolveSessionExpired(): void {
  lastResolvedAt = Date.now();
  if (!expired) return;
  expired = false;
  emit();
}

export function subscribeSessionExpired(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isSessionExpired(): boolean {
  return expired;
}
