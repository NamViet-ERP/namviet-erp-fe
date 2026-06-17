/** Chuyển thông báo lỗi API (Identity, ASP.NET…) sang tiếng Việt cho UI. */
export function translateErrorMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;

  if (trimmed.includes(';')) {
    return trimmed
      .split(';')
      .map(part => translateErrorMessage(part.trim()))
      .filter(Boolean)
      .join('; ');
  }

  const lower = trimmed.toLowerCase();

  if (lower.includes('passwords must have at least one lowercase')) {
    return 'Mật khẩu cần có ít nhất một chữ thường';
  }
  if (lower.includes('passwords must have at least one uppercase')) {
    return 'Mật khẩu cần có ít nhất một chữ hoa';
  }
  if (lower.includes('passwords must have at least one digit')) {
    return 'Mật khẩu cần có ít nhất một chữ số';
  }
  if (lower.includes('passwords must have at least one non alphanumeric')) {
    return 'Mật khẩu cần có ít nhất một ký tự đặc biệt';
  }

  const minLen = lower.match(/passwords must be at least (\d+) characters?/);
  if (minLen) {
    return `Mật khẩu tối thiểu ${minLen[1]} ký tự`;
  }

  if (lower.includes('incorrect password')) return 'Mật khẩu không đúng';
  if (lower.includes('invalid token')) return 'Mã xác thực không hợp lệ';
  if (lower.includes('user already has a password')) return 'Tài khoản đã có mật khẩu';
  if (lower.includes('username') && lower.includes('is already taken')) {
    return 'Tên đăng nhập đã được sử dụng';
  }
  if (lower.includes('email') && lower.includes('is already taken')) {
    return 'Email đã được sử dụng';
  }

  return trimmed;
}

export const PASSWORD_HINT = 'Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số';
