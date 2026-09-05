/**
 * Gia hạn access JWT trước khi hết hạn (silent refresh qua cookie).
 * Access token ~15' — không đợi request API bị 401 mới refresh.
 */
import {
  getAccessTokenExpiryMs,
  getStoredToken,
  isAccessTokenExpired,
  subscribeAccessToken,
} from './authSession';
import { refreshAccessToken } from './authRefresh';

/** Refresh trước khi JWT hết hạn bấy nhiêu ms. */
const REFRESH_BEFORE_MS = 2 * 60_000;
/** Không schedule quá sát (tránh loop). */
const MIN_DELAY_MS = 5_000;
/** Khi API tạm lỗi, thử lại sau. */
const RETRY_UNAVAILABLE_MS = 30_000;

let timerId: ReturnType<typeof setTimeout> | null = null;
let started = false;
let refreshInFlight = false;

function clearTimer(): void {
  if (timerId != null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function scheduleAt(delayMs: number): void {
  clearTimer();
  timerId = setTimeout(() => {
    void runProactiveRefresh();
  }, delayMs);
}

function scheduleFromCurrentToken(): void {
  clearTimer();
  const token = getStoredToken();
  if (!token) return;

  const expMs = getAccessTokenExpiryMs(token);
  if (expMs == null) return;

  // Đã sát/hết hạn → refresh ngay (sau MIN_DELAY để coalesced với login vừa xong).
  if (Date.now() >= expMs - REFRESH_BEFORE_MS) {
    scheduleAt(MIN_DELAY_MS);
    return;
  }

  scheduleAt(Math.max(MIN_DELAY_MS, expMs - Date.now() - REFRESH_BEFORE_MS));
}

async function runProactiveRefresh(): Promise<void> {
  if (refreshInFlight) return;
  const token = getStoredToken();
  if (!token) return;

  // Token vẫn còn dài hạn → chỉ reschedule (có thể vừa login/refresh chỗ khác).
  if (!isAccessTokenExpired(token, REFRESH_BEFORE_MS)) {
    scheduleFromCurrentToken();
    return;
  }

  refreshInFlight = true;
  try {
    const result = await refreshAccessToken();
    if (result === 'refreshed') {
      scheduleFromCurrentToken();
      return;
    }
    if (result === 'unavailable') {
      scheduleAt(RETRY_UNAVAILABLE_MS);
      return;
    }
    // rejected: không mở dialog ở đây — lần API tiếp theo sẽ xử lý SessionExpiredDialog.
    clearTimer();
  } finally {
    refreshInFlight = false;
  }
}

function onVisibilityOrFocus(): void {
  if (document.visibilityState && document.visibilityState !== 'visible') return;
  const token = getStoredToken();
  if (!token) return;
  if (isAccessTokenExpired(token, REFRESH_BEFORE_MS)) {
    void runProactiveRefresh();
  }
}

/**
 * Bật scheduler một lần khi app load. Tự theo dõi mỗi lần setAccessToken/clear.
 */
export function startProactiveTokenRefresh(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  subscribeAccessToken(() => {
    scheduleFromCurrentToken();
  });

  document.addEventListener('visibilitychange', onVisibilityOrFocus);
  window.addEventListener('focus', onVisibilityOrFocus);

  scheduleFromCurrentToken();
}
