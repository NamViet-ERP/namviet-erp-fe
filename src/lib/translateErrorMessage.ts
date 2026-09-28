import { WMS_ERROR } from './wms/messages';
import { UI_ERROR } from './uiMessages';

function normalizeMessageKey(message: string): string {
  return message
    .trim()
    .toLowerCase()
    .replace(/[.;!?]+$/g, '')
    .replace(/\s+/g, ' ');
}

/** Gộp nhiều dòng lỗi thành một câu ngắn, bỏ trùng lặp. */
export function formatUserMessages(messages: string[]): string {
  const unique: string[] = [];

  for (const raw of messages) {
    const msg = translateErrorMessage(raw.trim());
    if (!msg) continue;

    const key = normalizeMessageKey(msg);
    const isDuplicate = unique.some(existing => {
      const existingKey = normalizeMessageKey(existing);
      return existingKey === key || existingKey.includes(key) || key.includes(existingKey);
    });
    if (isDuplicate) continue;

    unique.push(msg.replace(/[;]+$/g, '').trim());
  }

  if (unique.length === 0) return '';
  if (unique.length === 1) return ensureSentence(unique[0]);

  return unique.map(ensureSentence).join(' ');
}

function ensureSentence(message: string): string {
  const trimmed = message.trim().replace(/[;]+$/g, '').replace(/\.+$/g, '');
  if (!trimmed) return '';
  return `${trimmed}.`;
}

/** Chuyển thông báo lỗi kỹ thuật sang tiếng Việt cho người dùng. */
export function translateErrorMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;

  const lower = trimmed.toLowerCase();
  if (isTransientFailureMessage(lower)) {
    return UI_ERROR.transient;
  }

  if (trimmed.includes(';')) {
    return formatUserMessages(trimmed.split(';'));
  }

  if (/failed to fetch|networkerror|network request failed|load failed/i.test(trimmed)) {
    return WMS_ERROR.network;
  }
  if (/aborterror|the operation was aborted|signal timed out/i.test(lower)) {
    return WMS_ERROR.timeout;
  }
  if (/\btimeout\b/i.test(lower)) {
    return WMS_ERROR.timeout;
  }
  if (/^typeerror:/i.test(trimmed) && lower.includes('fetch')) {
    return WMS_ERROR.network;
  }

  if (lower.includes('could not be converted') || lower.includes('json value could not')) {
    return 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại form.';
  }
  if (
    lower.includes('linq expression') ||
    lower.includes('could not be translated') ||
    lower.includes('entityframeworkcore')
  ) {
    return 'Hệ thống chưa xử lý được yêu cầu. Vui lòng thử lại sau.';
  }
  if (lower.includes('the request field is required')) {
    return 'Vui lòng kiểm tra lại thông tin form.';
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

  if (lower === 'not found') return 'Không tìm thấy dữ liệu hoặc tệp tin yêu cầu.';

  if (
    lower === 'internal server error'
    || lower.includes('an error occurred while processing')
    || lower.includes('one or more validation errors')
    || lower.includes('a non-empty request body is required')
    || lower.includes('the input was not valid')
    || lower.includes('unsupported media type')
    || /\bexception\b/.test(lower)
    || /\bsystem\./.test(lower)
    || /\bstack trace\b/.test(lower)
    || /\bnullreference\b/.test(lower)
    || /\bdbupdate\b/.test(lower)
  ) {
    console.error('[translateErrorMessage] Unmapped technical error:', trimmed);
    return 'Thao tác không thành công. Vui lòng thử lại hoặc báo quản trị viên.';
  }

  return trimmed;
}

/** Ẩn thông báo kỹ thuật (fetch, API, backend…) khỏi UI người dùng. */
export function isTechnicalUserMessage(message: string): boolean {
  const lower = message.trim().toLowerCase();
  if (!lower) return true;
  if (isTransientFailureMessage(lower)) return true;
  if (lower.includes('path:') && lower.includes('linenumber:')) return true;
  if (lower.includes('linq expression') || lower.includes('could not be translated')) return true;
  if (lower.includes('entityframeworkcore') || lower.includes('transparentidentifier')) return true;
  if (lower.includes('could not be converted') || lower.includes('json value could not')) return true;
  if (/^an exception has been raised/i.test(lower)) return true;
  if (/\bsystem\.[a-z.]*(exception|error)\b/i.test(lower)) return true;
  return (
    /failed to fetch|networkerror|fetch failed|load failed/i.test(lower) ||
    /\bbackend\b/.test(lower) ||
    /\bvite_/.test(lower) ||
    /\/api\//.test(lower) ||
    (/\bapi\b/.test(lower) && /(error|check|restart|khởi động)/i.test(lower))
  );
}

function isTransientFailureMessage(lower: string): boolean {
  return (
    lower.includes('transient failure')
    || lower.includes('the database is not currently available')
    || lower.includes('timeout expired')
    || lower.includes('could not connect')
    || lower.includes('connection refused')
    || lower.includes('server closed the connection')
    || lower.includes('connection pool has been exhausted')
    || lower.includes('npgsql')
    || lower.includes('postgresexception')
    || lower.includes('nv-503')
    || /\bsqlstate\b/.test(lower)
  );
}

export const PASSWORD_HINT = 'Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số';
