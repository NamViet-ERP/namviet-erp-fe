/** Format ISO / API date string for Vietnamese locale (dd/MM/yyyy). */
export function formatDateVi(iso?: string): string | undefined {
  if (!iso) return undefined;
  const trimmed = iso.trim();
  const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return trimmed;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d.toLocaleDateString('vi-VN');
}

/** Format ISO datetime for Vietnamese locale display. */
export function formatDateTimeVi(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? undefined
    : d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
}

/** Table cell fallback for empty dates. */
export function formatDateCell(iso?: string): string {
  return formatDateVi(iso) ?? '—';
}

/** Admin list dates may already be dd/MM/yyyy from API. */
export function formatAdminDateCell(value?: string): string {
  if (!value || value === '—') return '—';
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) return value;
  return formatDateCell(value);
}

/** Mask national ID / account numbers — show first & last 3 digits only. */
export function maskSensitiveId(value?: string): string | undefined {
  if (!value) return undefined;
  const raw = value.replace(/\s/g, '');
  if (raw.length <= 6) return '•'.repeat(raw.length);
  const head = raw.slice(0, 3);
  const tail = raw.slice(-3);
  const hidden = Math.max(0, raw.length - 6);
  return `${head}${'•'.repeat(hidden)}${tail}`;
}
