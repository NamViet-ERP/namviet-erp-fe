/** Mã NV: tiền tố NV- + 4 chữ số (VD: NV-0100 → NV-0101). */
export const EMPLOYEE_CODE_PREFIX = 'NV-';
export const EMPLOYEE_CODE_DIGITS = 4;

const PENDING_PREFIX = '__PENDING__';

export function formatEmployeeCodeNumber(num: number): string {
  return String(num).padStart(EMPLOYEE_CODE_DIGITS, '0');
}

export function formatEmployeeCode(num: number): string {
  return `${EMPLOYEE_CODE_PREFIX}${formatEmployeeCodeNumber(num)}`;
}

/** Lấy phần số cuối từ mã (0100, NV-0100, …). */
export function parseEmployeeCodeNumber(code: string): number | null {
  const trimmed = code.trim();
  if (!trimmed || trimmed.startsWith(PENDING_PREFIX)) return null;
  const match = /(\d+)$/.exec(trimmed);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return Number.isNaN(n) ? null : n;
}

export function getEmployeeCodeNumberPart(code: string): string {
  const n = parseEmployeeCodeNumber(code);
  return n === null ? '' : formatEmployeeCodeNumber(n);
}

/** Gợi ý mã kế tiếp (NV-XXXX) từ danh sách mã NV đang làm. */
export function suggestNextEmployeeCode(codes: (string | undefined)[]): string {
  let max = 0;
  for (const code of codes) {
    if (!code) continue;
    const n = parseEmployeeCodeNumber(code);
    if (n !== null && n > max) max = n;
  }
  return formatEmployeeCode(max + 1);
}

/** Sắp xếp mã NV mới → cũ (7966 trước 7965); chưa có mã xuống cuối. */
export function compareEmployeeCodeNewestFirst(
  a: { code?: string },
  b: { code?: string },
): number {
  const aNum = a.code ? parseEmployeeCodeNumber(a.code) : null;
  const bNum = b.code ? parseEmployeeCodeNumber(b.code) : null;
  if (aNum === null && bNum === null) return 0;
  if (aNum === null) return 1;
  if (bNum === null) return -1;
  return bNum - aNum;
}

export function employeeCodeNextHint(code: string): string {
  const numberPart = getEmployeeCodeNumberPart(code);
  if (!numberPart) return '';
  return `Mã NV tiếp theo có số: ${numberPart}`;
}
