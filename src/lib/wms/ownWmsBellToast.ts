import { AUTH_CHANGED_EVENT } from '../../constants/systemUsers';

/** Voucher codes the current session just created/submitted — do not pop the bell toast. */
const suppressedCodes = new Set<string>();

function normalize(voucherCode: string | null | undefined): string {
  return voucherCode?.trim() ?? '';
}

export function suppressOwnWmsBellToast(voucherCode: string | null | undefined): void {
  const code = normalize(voucherCode);
  if (code) suppressedCodes.add(code);
}

export function isOwnWmsBellToastSuppressed(voucherCode: string | null | undefined): boolean {
  const code = normalize(voucherCode);
  return code.length > 0 && suppressedCodes.has(code);
}

if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_CHANGED_EVENT, () => suppressedCodes.clear());
}
