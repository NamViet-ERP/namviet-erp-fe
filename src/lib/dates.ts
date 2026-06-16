const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** dd/MM/yyyy → Date */
export function parseDisplayDate(display: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(display.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

/** ISO yyyy-MM-dd → dd/MM/yyyy */
export function isoToDisplay(iso?: string): string {
  if (!iso) return '';
  const m = ISO_RE.exec(iso);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
}

/** Parse ISO yyyy-MM-dd to local Date (no timezone drift). */
export function parseIsoDate(iso?: string): Date | null {
  if (!iso) return null;
  const m = ISO_RE.exec(iso);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Local Date → ISO yyyy-MM-dd */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/** Monday-first weekday index: Mon=0 … Sun=6 */
export function mondayFirstIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
