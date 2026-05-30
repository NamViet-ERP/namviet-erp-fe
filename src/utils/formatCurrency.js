/**
 * Format number to Vietnamese currency (VND)
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(value);
}

/**
 * Format number to Vietnamese currency with đ suffix
 * @param {number} value 
 * @returns {string}
 */
export function formatCurrencyFull(value) {
  return formatCurrency(value) + ' đ';
}

/**
 * Format large numbers to abbreviated form (tỷ, triệu)
 * @param {number} value
 * @returns {string}
 */
export function formatCurrencyShort(value) {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1).replace('.0', '') + ' tỷ';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(0) + ' triệu';
  }
  return formatCurrency(value);
}
