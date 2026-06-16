/**
 * Thin fetch wrapper for talking to the C# .NET Core API.
 *
 * - Reads the base URL from `import.meta.env.VITE_API_BASE_URL`.
 * - Sends/parses JSON and normalizes failures into `ApiError`.
 * - Has a slot to attach a JWT `Authorization: Bearer` header (for .NET Core
 *   Identity/JWT later) without touching call sites.
 *
 * Domain services depend on this so swapping mock → real API is a config change.
 */

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
  errors?: Record<string, string[]>;
}

/** User-facing message from any caught error (never raw JSON). */
export function getApiErrorMessage(err: unknown, fallback = 'Đã xảy ra lỗi'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return fallback;
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
        return trimmed;
      }
    }
    return trimmed;
  }

  if (typeof data === 'object') {
    const obj = data as ProblemDetailsLike;
    if (typeof obj.detail === 'string' && obj.detail.trim()) return obj.detail.trim();
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message.trim();
    if (typeof obj.title === 'string' && obj.title.trim()) return obj.title.trim();
    if (obj.errors && typeof obj.errors === 'object') {
      const msgs = Object.values(obj.errors).flat().filter(Boolean);
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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, headers, ...rest } = options;
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

  if (!response.ok) {
    const message = extractErrorMessage(
      data,
      `Yêu cầu thất bại (HTTP ${response.status})`,
    );
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
    const token = authTokenProvider();
    const url = buildUrl(path);
    return fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (response) => {
      const data = await readResponseBody(response);
      if (!response.ok) {
        const message = extractErrorMessage(
          data,
          `Yêu cầu thất bại (HTTP ${response.status})`,
        );
        throw new ApiError(message, response.status, data);
      }
      return data as T;
    });
  },
};
