/** Sentence case cho đơn vị tính — khớp BE MaterialUnitHelper. */
export function normalizeMaterialUnitName(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLocaleLowerCase('vi-VN');
  return lower.charAt(0).toLocaleUpperCase('vi-VN') + lower.slice(1);
}
