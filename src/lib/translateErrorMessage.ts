import { WMS_ERROR } from './wms/messages';

/** Chuyển thông báo lỗi kỹ thuật sang tiếng Việt cho người dùng. */
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

  if (/failed to fetch|networkerror|network request failed|load failed/i.test(trimmed)) {
    return WMS_ERROR.network;
  }
  if (/aborterror|the operation was aborted|signal timed out|timeout/i.test(lower)) {
    return WMS_ERROR.timeout;
  }
  if (/^typeerror:/i.test(trimmed) && lower.includes('fetch')) {
    return WMS_ERROR.network;
  }

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

/** Ẩn thông báo kỹ thuật (fetch, API, backend…) khỏi UI người dùng. */
export function isTechnicalUserMessage(message: string): boolean {
  const lower = message.trim().toLowerCase();
  if (!lower) return true;
  return (
    /failed to fetch|networkerror|fetch failed|load failed/i.test(lower) ||
    /\bbackend\b/.test(lower) ||
    /\bvite_/.test(lower) ||
    /\/api\//.test(lower) ||
    (/\bapi\b/.test(lower) && /(error|check|restart|khởi động)/i.test(lower))
  );
}

export const PASSWORD_HINT = 'Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số';
