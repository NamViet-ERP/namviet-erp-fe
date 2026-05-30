/**
 * Format date string to dd/MM/yyyy
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string' && date.includes('/')) return date;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get current date as dd/MM/yyyy
 * @returns {string}
 */
export function getCurrentDate() {
  return formatDate(new Date());
}
