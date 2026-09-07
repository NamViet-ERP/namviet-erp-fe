/** Mã tài khoản hệ thống: SYS- + 4 chữ số (VD: SYS-0001). Không lấy timestamp SYS-20260907…. */
export const SYSTEM_CODE_PREFIX = 'SYS-';
export const SYSTEM_CODE_DIGITS = 4;
export const SYSTEM_CODE_MAX_LENGTH = 50;

const SEQUENTIAL_RE = /^SYS-(\d{1,4})$/i;
const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function formatSystemCodeNumber(num: number): string {
  return String(num).padStart(SYSTEM_CODE_DIGITS, '0');
}

export function formatSystemCode(num: number): string {
  return `${SYSTEM_CODE_PREFIX}${formatSystemCodeNumber(num)}`;
}

export function parseSystemCodeNumber(code: string): number | null {
  const match = SEQUENTIAL_RE.exec(code.trim());
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return Number.isNaN(n) ? null : n;
}

export function suggestNextSystemCode(codes: (string | undefined)[]): string {
  let max = 0;
  for (const code of codes) {
    if (!code || code === '—') continue;
    const n = parseSystemCodeNumber(code);
    if (n !== null && n > max) max = n;
  }
  return formatSystemCode(max + 1);
}

export function validateSystemAccountCode(code: string): string | null {
  const trimmed = code.trim();
  if (!trimmed) return 'Vui lòng nhập mã tài khoản';
  if (trimmed.length > SYSTEM_CODE_MAX_LENGTH) return 'Mã không được quá 50 ký tự';
  if (!CODE_RE.test(trimmed)) return 'Mã chỉ gồm chữ, số, dấu gạch và dấu chấm';
  if (/^NV-/i.test(trimmed)) return 'Mã tài khoản hệ thống dùng SYS-, không dùng NV-';
  return null;
}
