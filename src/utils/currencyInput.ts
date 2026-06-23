/** Parse user input with Vietnamese thousand separators (1.000 → 1000). */
export function parseCurrencyInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number(digits);
}

/** Format number for currency input display (1000 → 1.000). */
export function formatCurrencyInput(value: number): string {
  if (!value || value <= 0) return '';
  return new Intl.NumberFormat('vi-VN').format(value);
}
