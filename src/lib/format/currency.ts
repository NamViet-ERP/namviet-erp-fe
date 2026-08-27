export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(value);
}

export function formatCurrencyFull(value: number | null | undefined): string {
  return `${formatCurrency(value)}\u00a0đ`;
}

export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrencyInput(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '';
  return formatCurrency(value);
}

export function formatCurrencyVnd(value: number | null | undefined): string {
  return `${formatCurrency(value)} VNĐ`;
}

export function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1).replace('.0', '') + ' tỷ';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(0) + ' triệu';
  }
  return formatCurrency(value);
}
