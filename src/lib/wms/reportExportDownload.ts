import { getStoredToken } from '../authSession';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function buildUrl(endpoint: string, params?: Record<string, string | undefined>): string {
  const url = new URL(`${BASE_URL}${endpoint}`, BASE_URL || window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function downloadReportExport(
  endpoint: string,
  fileName: string,
  params?: Record<string, string | undefined>,
): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(buildUrl(endpoint, params), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text.trim() || `Không thể xuất báo cáo (HTTP ${response.status})`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none';
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }, 500);
}
