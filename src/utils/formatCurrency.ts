/**
 * Format number to Vietnamese currency (VND)
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(value);
}

/**
 * Format number to Vietnamese currency with đ suffix
 * @param {number | null | undefined} value 
 * @returns {string}
 */
export function formatCurrencyFull(value: number | null | undefined): string {
  return formatCurrency(value) + ' đ';
}

/** Bỏ mọi ký tự không phải số → số tiền nguyên (VNĐ). */
export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

/** Hiển thị kiểu 13.750.000 khi gõ / gán số tiền. */
export function formatCurrencyInput(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '';
  return formatCurrency(value);
}

/** 13.750.000 VNĐ */
export function formatCurrencyVnd(value: number | null | undefined): string {
  return `${formatCurrency(value)} VNĐ`;
}

/**
 * Format large numbers to abbreviated form (tỷ, triệu)
 * @param {number} value
 * @returns {string}
 */
export function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1).replace('.0', '') + ' tỷ';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(0) + ' triệu';
  }
  return formatCurrency(value);
}
