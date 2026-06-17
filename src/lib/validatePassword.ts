/** Client-side password rules aligned with ASP.NET Identity defaults in BE. */
export function validatePassword(password: string): string | undefined {
  if (!password.trim()) return 'Vui lòng nhập mật khẩu';
  if (password.length < 8) return 'Mật khẩu tối thiểu 8 ký tự';
  if (!/[a-z]/.test(password)) return 'Mật khẩu cần có ít nhất một chữ thường';
  if (!/[A-Z]/.test(password)) return 'Mật khẩu cần có ít nhất một chữ hoa';
  if (!/[0-9]/.test(password)) return 'Mật khẩu cần có ít nhất một chữ số';
  return undefined;
}
