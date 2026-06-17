/**
 * Thin fetch wrapper for talking to the C# .NET Core API.
 *
 * - Reads the base URL from `import.meta.env.VITE_API_BASE_URL`.
 * - Sends/parses JSON and normalizes failures into `ApiError`.
 * - On 401, tries silent refresh before forcing logout.
 */

import { clearAuthSession } from './authSession';
import { refreshAccessToken } from './authRefresh';
import { translateErrorMessage } from './translateErrorMessage';

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

/** User-facing message from any caught error (never raw JSON). */
export function getApiErrorMessage(err: unknown, fallback = 'Đã xảy ra lỗi'): string {
  if (err instanceof ApiError) return translateErrorMessage(err.message);
  if (err instanceof Error && err.message.trim()) return translateErrorMessage(err.message.trim());
  return fallback;
}

function forceLogoutExpired(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/login')) return;
  clearAuthSession();
  window.location.assign('/login?expired=1');
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (data == null) return fallback;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) return fallback;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return extractErrorMessage(JSON.parse(trimmed), fallback);
      } catch {
        return translateErrorMessage(trimmed);
      }
    }
    return translateErrorMessage(trimmed);
  }

  if (typeof data === 'object') {
    const obj = data as ProblemDetailsLike;
    if (typeof obj.detail === 'string' && obj.detail.trim()) {
      return translateErrorMessage(obj.detail.trim());
    }
    if (typeof obj.message === 'string' && obj.message.trim()) {
      return translateErrorMessage(obj.message.trim());
    }
    if (typeof obj.title === 'string' && obj.title.trim()) {
      return translateErrorMessage(obj.title.trim());
    }
    if (obj.errors && typeof obj.errors === 'object') {
      const raw = Array.isArray(obj.errors)
        ? obj.errors
        : Object.values(obj.errors).flat();
      const msgs = raw.filter(Boolean).map(item => translateErrorMessage(String(item)));
      if (msgs.length) return msgs.join('; ');
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

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, headers, _retried, ...rest } = options;
  const token = authTokenProvider();

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await readResponseBody(response);

  if (response.status === 401 && !_retried && !path.includes('/api/auth/login') && !path.includes('/api/auth/refresh')) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return request<T>(path, { ...options, _retried: true });
    }
  }

  if (!response.ok) {
    const message = extractErrorMessage(
      data,
      response.status === 401
        ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        : response.status === 403
          ? 'Bạn không có quyền truy cập chức năng này.'
          : `Yêu cầu thất bại (HTTP ${response.status})`,
    );
    if (response.status === 401) forceLogoutExpired();
    throw new ApiError(message, response.status, data);
  }

  return data as T;
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

  postForm: <T>(path: string, formData: FormData) => {
    const run = async (retried = false): Promise<T> => {
      const token = authTokenProvider();
      const url = buildUrl(path);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      const data = await readResponseBody(response);

      if (response.status === 401 && !retried) {
        const refreshed = await tryRefreshSession();
        if (refreshed) return run(true);
      }

      if (!response.ok) {
        const message = extractErrorMessage(
          data,
          response.status === 401
            ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            : response.status === 403
              ? 'Bạn không có quyền truy cập chức năng này.'
              : `Yêu cầu thất bại (HTTP ${response.status})`,
        );
        if (response.status === 401) forceLogoutExpired();
        throw new ApiError(message, response.status, data);
      }
      return data as T;
    };
    return run();
  },
};
