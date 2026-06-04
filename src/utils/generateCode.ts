import type { VoucherPrefix } from '../types';

const counters: Record<VoucherPrefix, number> = {
  CK: 125,
  CDK: 57,
  NK: 2147,
  XK: 1893,
  KK: 1530,
  'ĐCT': 1453,
};

/**
 * Generate next voucher code for a given prefix
 * @param {'CK'|'CDK'|'NK'|'XK'|'KK'|'ĐCT'} prefix
 * @returns {string}
 */
export function generateCode(prefix: VoucherPrefix): string {
  const current = counters[prefix] || 1;
  counters[prefix] = current + 1;
  return `${prefix}-${String(current).padStart(6, '0')}`;
}
