import { getStoredToken } from '../authSession';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export interface VoucherExportQuery {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  search?: string;
}

function buildExportUrl(endpoint: string, params?: VoucherExportQuery): string {
  const url = new URL(`${BASE_URL}${endpoint}`, BASE_URL || window.location.origin);
  if (params?.dateFrom) url.searchParams.set('dateFrom', params.dateFrom);
  if (params?.dateTo) url.searchParams.set('dateTo', params.dateTo);
  if (params?.status && params.status !== 'all') url.searchParams.set('status', params.status);
  if (params?.search?.trim()) url.searchParams.set('search', params.search.trim());
  return url.toString();
}

export async function downloadVoucherExport(
  endpoint: string,
  fileName: string,
  params?: VoucherExportQuery,
): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(buildExportUrl(endpoint, params), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text.trim() || `Không thể xuất Excel (HTTP ${response.status})`);
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
