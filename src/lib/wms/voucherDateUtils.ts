export interface VoucherDateFields {
  createdAt?: string;
  date?: string;
}

export interface VoucherListParams {
  dateFrom?: string;
  dateTo?: string;
}

export function appendVoucherDateQuery(path: string, params?: VoucherListParams): string {
  if (!params?.dateFrom && !params?.dateTo) return path;
  const qs = new URLSearchParams();
  if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
  if (params.dateTo) qs.set('dateTo', params.dateTo);
  return `${path}?${qs.toString()}`;
}

export function getVoucherCreatedAt(v: VoucherDateFields): Date | null {
  if (v.createdAt) {
    const parsed = new Date(v.createdAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (v.date) {
    const m = v.date.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  }
  return null;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isVoucherInDateRange(
  v: VoucherDateFields,
  from?: string,
  to?: string,
): boolean {
  const created = getVoucherCreatedAt(v);
  if (!created) return !from && !to;

  const day = startOfDay(created).getTime();
  if (from) {
    const fromDay = startOfDay(new Date(from)).getTime();
    if (day < fromDay) return false;
  }
  if (to) {
    const toDay = startOfDay(new Date(to)).getTime();
    if (day > toDay) return false;
  }
  return true;
}
