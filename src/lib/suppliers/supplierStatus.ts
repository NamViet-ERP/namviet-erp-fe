export const SUPPLIER_APPROVAL = {
  New: 'new',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;

export const SUPPLIER_LIMITS = {
  codeMax: 50,
  nameMax: 255,
  phoneMax: 50,
  paymentTermsMax: 500,
  maxDebtDaysMin: 0,
  maxDebtDaysMax: 3650,
} as const;

export type SupplierApprovalStatus =
  (typeof SUPPLIER_APPROVAL)[keyof typeof SUPPLIER_APPROVAL];

export function normalizeSupplierApproval(status?: string | null): SupplierApprovalStatus {
  const value = (status ?? '').trim().toLowerCase();
  if (value === SUPPLIER_APPROVAL.New || value === SUPPLIER_APPROVAL.Rejected) return value;
  return SUPPLIER_APPROVAL.Approved;
}

export function isSupplierOrderable(supplier: {
  approvalStatus?: string | null;
  isBlacklisted?: boolean;
}): boolean {
  return !supplier.isBlacklisted && normalizeSupplierApproval(supplier.approvalStatus) === SUPPLIER_APPROVAL.Approved;
}

export function supplierGradeLabel(rating?: string | null): string {
  const value = rating?.trim();
  if (!value || value === '—') return 'D';
  return value;
}

export function parseMaxDebtDays(
  raw: string,
): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'Hạn công nợ là bắt buộc.' };
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: 'Hạn công nợ phải là số nguyên.' };
  if (trimmed.length > 4) {
    return { ok: false, error: 'Hạn công nợ từ 0 đến 3650 ngày.' };
  }
  const value = Number(trimmed);
  if (value < SUPPLIER_LIMITS.maxDebtDaysMin || value > SUPPLIER_LIMITS.maxDebtDaysMax) {
    return { ok: false, error: 'Hạn công nợ từ 0 đến 3650 ngày.' };
  }
  return { ok: true, value };
}

export function foldSupplierName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replaceAll('đ', 'd');
}

export function isSameSupplierName(a: string, b: string): boolean {
  const key = foldSupplierName(a);
  return key.length > 0 && key === foldSupplierName(b);
}

export const VN_PHONE_INVALID = 'SĐT không hợp lệ. Chỉ nhập 10 số, bắt đầu bằng 0 (vd. 0912345678).';

/** Chỉ giữ chữ số, tối đa 10. Dán chữ / ký tự lạ bị bỏ, không được lưu. */
export function restrictVnPhoneInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10);
}

export function validateOptionalVietnamPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed) || !/^0\d{9}$/.test(trimmed)) return VN_PHONE_INVALID;
  return null;
}
