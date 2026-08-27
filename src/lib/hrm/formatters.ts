export {
  formatAdminDateCell,
  formatDateCell,
  formatDateTimeVi,
  formatDateVi,
} from '../format/dates';

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
