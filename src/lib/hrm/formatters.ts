/** Format ISO date string for Vietnamese locale display. */
export function formatDateVi(iso?: string): string | undefined {
  if (!iso) return undefined;
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

export function birthYearFromIso(iso: string): string | number {
  const y = new Date(iso).getFullYear();
  return Number.isNaN(y) ? '—' : y;
}
