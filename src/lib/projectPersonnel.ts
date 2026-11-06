const SYSTEM_ROLE_PATTERNS: RegExp[] = [
  /^kho\s*h[àa]ng$/i,
  /^khohang$/i,
  /^kho\s*t[ổo]ng$/i,
  /^khotong$/i,
  /^th[ủu]\s*kho$/i,
  /^thukho$/i,
  /^warehouse(\s*keeper)?$/i,
  /^warehouse_keeper$/i,
  /^cung\s*[ứu]ng$/i,
  /^cungung$/i,
  /^procurement(\s*(lead|boss))?$/i,
  /^procurement_(lead|boss)$/i,
  /^k[ếe]\s*to[áa]n(\s*kho)?$/i,
  /^ketoan(kho)?$/i,
  /^accountant$/i,
  /^admin(istrator)?$/i,
  /^h[ệe]\s*th[ốo]ng$/i,
  /^hethong$/i,
  /^system$/i,
  /^qu[ảa]n\s*tr[ịi]\s*vi[êe]n$/i,
  /^quantrivien$/i,
  /^ban\s*gi[áa]m\s*[đd][ốo]c$/i,
  /^bangiamdoc$/i,
  /^bod$/i,
  /^nh[âa]n\s*vi[êe]n$/i,
  /^nhanvien$/i,
  /^staff$/i,
];

export const EMPTY_PM_FALLBACK = 'Chưa phân công PM';

/**
 * Kiểm tra xem tên có phải là tài khoản hệ thống / tài khoản mang tên vai trò không
 */
export function isSystemRoleAccount(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-' || trimmed.toLowerCase() === 'null') {
    return true;
  }

  // Remove email domain if email format
  const baseName = trimmed.includes('@')
    ? trimmed.split('@')[0].replace(/[._-]/g, ' ').trim()
    : trimmed;

  const normalizedWithoutSymbols = baseName.replace(/[._-]/g, ' ').trim();
  const normalizedNoSpaces = baseName.replace(/[\s._-]/g, '').trim();

  return SYSTEM_ROLE_PATTERNS.some(
    pattern =>
      pattern.test(trimmed) ||
      pattern.test(baseName) ||
      pattern.test(normalizedWithoutSymbols) ||
      pattern.test(normalizedNoSpaces),
  );
}

/**
 * Chuẩn hóa tên hiển thị của Chỉ huy trưởng (PM / PIC).
 * Nếu rỗng hoặc là tài khoản hệ thống thì hiển thị chuẩn: "Chưa phân công PM".
 */
export function formatPmDisplayName(pmName?: string | null): string {
  if (isSystemRoleAccount(pmName)) {
    return EMPTY_PM_FALLBACK;
  }
  return pmName!.trim();
}

/**
 * Alias cho formatPmDisplayName theo quy chuẩn Living Invariants
 */
export const formatPersonnelLabel = formatPmDisplayName;

/**
 * Kiểm tra tính hợp lệ của Chỉ huy trưởng
 */
export function hasValidPm(pmName?: string | null, pmId?: string | null): boolean {
  if (isSystemRoleAccount(pmName)) return false;
  if (!pmId || pmId === '00000000-0000-0000-0000-000000000000') return false;
  return true;
}
