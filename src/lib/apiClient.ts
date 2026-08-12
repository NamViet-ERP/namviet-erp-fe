/**
 * Thin fetch wrapper for talking to the C# .NET Core API.
 *
 * - Reads the base URL from `import.meta.env.VITE_API_BASE_URL`.
 * - Sends/parses JSON and normalizes failures into `ApiError`.
 * - On 401, tries silent refresh before forcing logout.
 */

import { clearAuthSession } from './authSession';
import { refreshAccessToken, type AuthRefreshResult } from './authRefresh';
import { UI_ERROR } from './uiMessages';
import { translateErrorMessage, isTechnicalUserMessage, formatUserMessages } from './translateErrorMessage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** Normalized API failure. Carries the HTTP status and any server payload. */
export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

interface ProblemDetailsLike {
  title?: string;
  detail?: string;
  message?: string;
  errors?: Record<string, string[]> | string[];
}

/** User-facing message from any caught error (never raw JSON or technical jargon). */
export function getApiErrorMessage(err: unknown, fallback: string = UI_ERROR.generic): string {
  let msg = fallback;
  if (err instanceof ApiError) msg = translateErrorMessage(err.message);
  else if (err instanceof Error && err.message.trim()) msg = translateErrorMessage(err.message.trim());
  if (!msg.trim() || isTechnicalUserMessage(msg)) return fallback;
  return msg;
}

function normalizeErrorField(key: string): string | null {
  let field = key.trim();
  if (field.startsWith('$.')) field = field.slice(2);
  if (field.toLowerCase().startsWith('request.')) field = field.slice(8);
  const last = field.split(/[./]/).pop()?.trim() ?? '';
  if (!last || ['_form', 'request', '$'].includes(last)) return null;
  return last.charAt(0).toLowerCase() + last.slice(1);
}

function firstErrorMessage(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const first = value.find(item => typeof item === 'string' && item.trim());
    return typeof first === 'string' ? first.trim() : undefined;
  }
  return undefined;
}

/** Field-level validation errors from API payload (`errors: { field: string[] }`). */
export function getApiFieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError) || err.payload == null || typeof err.payload !== 'object') return {};

  const obj = err.payload as ProblemDetailsLike;
  if (!obj.errors || typeof obj.errors !== 'object' || Array.isArray(obj.errors)) return {};

  const result: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(obj.errors)) {
    const fieldKey = normalizeErrorField(key);
    const first = firstErrorMessage(msgs);
    if (!fieldKey || !first) continue;
    result[fieldKey] = translateErrorMessage(first);
  }
  return result;
}

function isPublicApiPath(path: string): boolean {
  return path.includes('/api/public/');
}

function forceLogoutExpired(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/login')) return;
  if (window.location.pathname.startsWith('/estimates/fill')) return;
  const logoutUrl = buildUrl('/api/auth/logout');
  void fetch(logoutUrl, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: '{}',
  }).catch(() => undefined);
  clearAuthSession();
  window.location.assign('/login?expired=1');
}

export function parseApiError(data: unknown, fallback: string): string {
  if (data == null) return fallback;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) return fallback;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return parseApiError(JSON.parse(trimmed), fallback);
      } catch {
        return translateErrorMessage(trimmed);
      }
    }
    return translateErrorMessage(trimmed);
  }

  if (typeof data === 'object') {
    const obj = data as ProblemDetailsLike;
    if (obj.errors && typeof obj.errors === 'object') {
      if (Array.isArray(obj.errors)) {
        const msgs = obj.errors.filter(Boolean).map(item => String(item));
        const formatted = formatUserMessages(msgs);
        if (formatted) return formatted;
      } else {
        const entries = Object.entries(obj.errors);
        const specific = entries.filter(([key]) => !['_form', 'request', '$'].includes(key));
        const source = specific.length > 0 ? specific : entries;
        const msgs = source.flatMap(([, value]) => (Array.isArray(value) ? value : [value]))
          .filter(Boolean)
          .map(item => String(item));
        const formatted = formatUserMessages(msgs);
        if (formatted) return formatted;
      }
    }
    if (typeof obj.detail === 'string' && obj.detail.trim()) {
      return translateErrorMessage(obj.detail.trim());
    }
    if (typeof obj.message === 'string' && obj.message.trim()) {
      return translateErrorMessage(obj.message.trim());
    }
    if (typeof obj.title === 'string' && obj.title.trim()) {
      return translateErrorMessage(obj.title.trim());
    }
  }

  return fallback;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Auth token provider — swap this for your real auth store when wiring JWT. */
let authTokenProvider: () => string | null = () => null;

export function setAuthTokenProvider(provider: () => string | null): void {
  authTokenProvider = provider;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Plain object — serialized to JSON automatically. */
  body?: unknown;
  /** Query string params. */
  params?: Record<string, string | number | boolean | undefined>;
  /** Internal: skip refresh retry once. */
  _retried?: boolean;
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(`${BASE_URL}${path}`, BASE_URL || window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

let refreshInFlight: Promise<AuthRefreshResult> | null = null;

async function tryRefreshSession(): Promise<AuthRefreshResult> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function fallbackForStatus(status: number): string {
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền truy cập chức năng này.';
  return 'Yêu cầu không thành công. Vui lòng thử lại.';
}

function throwResponseError(response: Response, data: unknown, options?: { forceLogout?: boolean }): never {
  const message = parseApiError(data, fallbackForStatus(response.status));
  if (response.status === 401 && options?.forceLogout !== false) forceLogoutExpired();
  throw new ApiError(message, response.status, data);
}

async function handleUnauthorizedRetry<T>(
  retry: () => Promise<T>,
  onRejected: () => never,
): Promise<T> {
  const refreshResult = await tryRefreshSession();
  if (refreshResult === 'refreshed') return retry();
  // Mạng/API tạm lỗi: giữ phiên, không đá về login.
  if (refreshResult === 'unavailable') {
    throw new ApiError(
      'Không kết nối được máy chủ để gia hạn phiên. Thử lại sau.',
      503,
    );
  }
  onRejected();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, headers, _retried, ...rest } = options;
  const token = authTokenProvider();
  const publicApi = isPublicApiPath(path);

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    credentials: 'include',
    signal: AbortSignal.timeout(20_000),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token && !publicApi ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await readResponseBody(response);

  const skipRefresh =
    publicApi
    || path.includes('/api/auth/login')
    || path.includes('/api/auth/refresh')
    || path.includes('/api/auth/logout');

  if (response.status === 401 && !_retried && !skipRefresh) {
    return handleUnauthorizedRetry(
      () => request<T>(path, { ...options, _retried: true }),
      () => {
        const allowLogout = !path.includes('/api/auth/me');
        throwResponseError(response, data, { forceLogout: allowLogout });
      },
    );
  }

  if (!response.ok) {
    const forceLogout = response.status === 401 && !path.includes('/api/auth/me') && !skipRefresh;
    throwResponseError(response, data, { forceLogout });
  }

  return data as T;
}

function requestForm<T>(path: string, formData: FormData, method: 'POST' | 'PUT'): Promise<T> {
  const run = async (retried = false): Promise<T> => {
    const token = authTokenProvider();
    const url = buildUrl(path);
    const response = await fetch(url, {
      method,
      credentials: 'include',
      signal: AbortSignal.timeout(20_000),
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await readResponseBody(response);

    if (response.status === 401 && !retried) {
      return handleUnauthorizedRetry(
        () => run(true),
        () => {
          throwResponseError(response, data);
        },
      );
    }

    if (!response.ok) {
      throwResponseError(response, data);
    }
    return data as T;
  };
  return run();
}

export const apiClient = {
  get: <T>(path: string, params?: RequestOptions['params']) =>
    request<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  postForm: <T>(path: string, formData: FormData) =>
    requestForm<T>(path, formData, 'POST'),
  putForm: <T>(path: string, formData: FormData) =>
    requestForm<T>(path, formData, 'PUT'),

  getBlob: (
    path: string,
    params?: RequestOptions['params'],
    options?: { signal?: AbortSignal; headers?: HeadersInit },
  ) => {
    const run = async (retried = false): Promise<Blob> => {
      const token = authTokenProvider();
      const response = await fetch(buildUrl(path, params), {
        method: 'GET',
        credentials: 'include',
        signal: options?.signal ?? AbortSignal.timeout(20_000),
        headers: {
          Accept: '*/*',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers,
        },
      });

      if (response.status === 401 && !retried) {
        const data = await readResponseBody(response);
        return handleUnauthorizedRetry(
          () => run(true),
          () => {
            throwResponseError(response, data);
          },
        );
      }

      if (!response.ok) {
        throwResponseError(response, await readResponseBody(response));
      }
      return response.blob();
    };
    return run();
  },
};

export async function saveBlob(blob: Blob, fileName: string): Promise<boolean> {
  // Chromium: tải blob sau await hay bị mất user-gesture → "Needs permission to download".
  // Ưu tiên hộp thoại Save As (File System Access) khi có.
  const picker = (window as Window & {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{ description?: string; accept: Record<string, string[]> }>;
    }) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }>;
  }).showSaveFilePicker;

  if (typeof picker === 'function') {
    try {
      const handle = await picker({
        suggestedName: fileName,
        types: [
          {
            description: 'Excel',
            accept: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      // User cancelled save dialog.
      if (err instanceof DOMException && err.name === 'AbortError') return false;
      // Unsupported / denied → fallback below.
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
  document.body.appendChild(anchor);
  anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }, 1500);
  return true;
}
