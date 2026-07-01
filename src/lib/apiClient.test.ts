import { describe, it, expect } from 'vitest';
import { parseApiError } from './apiClient';

describe('parseApiError', () => {
  const fallback = 'Đã xảy ra lỗi hệ thống';

  it('should return fallback when data is null or undefined', () => {
    expect(parseApiError(null, fallback)).toBe(fallback);
    expect(parseApiError(undefined, fallback)).toBe(fallback);
  });

  describe('string handling', () => {
    it('should return translated message when data is a simple string', () => {
      expect(parseApiError('incorrect password', fallback)).toBe('Mật khẩu không đúng');
      expect(parseApiError('Some unmapped error', fallback)).toBe('Some unmapped error');
    });

    it('should recursively parse JSON strings', () => {
      const jsonStr = JSON.stringify({ detail: 'incorrect password' });
      expect(parseApiError(jsonStr, fallback)).toBe('Mật khẩu không đúng');
    });

    it('should fall back to translating the string if JSON parsing fails', () => {
      expect(parseApiError('{invalid json', fallback)).toBe('{invalid json');
    });
  });

  describe('object handling', () => {
    it('should prioritize obj.errors validation messages over other fields', () => {
      const payload = {
        title: 'Validation Failed',
        detail: 'One or more validation errors occurred.',
        message: 'Error message',
        errors: {
          Password: ['Passwords must have at least one uppercase', 'Passwords must be at least 8 characters'],
        },
      };

      const result = parseApiError(payload, fallback);
      // It should join and translate the errors:
      expect(result).toBe('Mật khẩu cần có ít nhất một chữ hoa. Mật khẩu tối thiểu 8 ký tự.');
    });

    it('should handle obj.errors when it is an array of strings', () => {
      const payload = {
        errors: ['incorrect password', 'invalid token'],
      };
      expect(parseApiError(payload, fallback)).toBe('Mật khẩu không đúng. Mã xác thực không hợp lệ.');
    });

    it('should fall back to detail if errors is missing or empty', () => {
      const payload = {
        detail: 'incorrect password',
        message: 'ignored message',
      };
      expect(parseApiError(payload, fallback)).toBe('Mật khẩu không đúng');
    });

    it('should fall back to message if errors and detail are missing', () => {
      const payload = {
        message: 'invalid token',
        title: 'ignored title',
      };
      expect(parseApiError(payload, fallback)).toBe('Mã xác thực không hợp lệ');
    });

    it('should fall back to title if errors, detail, and message are missing', () => {
      const payload = {
        title: 'incorrect password',
      };
      expect(parseApiError(payload, fallback)).toBe('Mật khẩu không đúng');
    });

    it('should return fallback if none of the expected fields are found', () => {
      const payload = { foo: 'bar' };
      expect(parseApiError(payload, fallback)).toBe(fallback);
    });

    describe('weird error payloads (adversarial review)', () => {
      it('should handle empty errors list or object', () => {
        expect(parseApiError({ errors: [] }, fallback)).toBe(fallback);
        expect(parseApiError({ errors: {} }, fallback)).toBe(fallback);
      });

      it('should handle errors as list of objects (potential limitation: returns stringified objects)', () => {
        const payload = {
          errors: [{ message: 'First error' }, { msg: 'Second error' }]
        };
        // String(item) => "[object Object]"; formatUserMessages dedupes identical strings.
        expect(parseApiError(payload, fallback)).toBe('[object Object].');
      });

      it('should handle errors as list of objects nested inside field keys', () => {
        const payload = {
          errors: {
            Password: [{ message: 'Must be secure' }]
          }
        };
        expect(parseApiError(payload, fallback)).toBe('[object Object].');
      });

      it('should return the raw HTML string for HTML error responses', () => {
        const html = '<!DOCTYPE html><html><body>502 Bad Gateway</body></html>';
        expect(parseApiError(html, fallback)).toBe(html);
      });

      it('should fallback to default for nested object detail/message/title', () => {
        const payload = {
          detail: { error: 'Nested detail description' },
          message: { text: 'Nested message description' },
          title: { text: 'Nested title' }
        };
        expect(parseApiError(payload, fallback)).toBe(fallback);
      });

      it('should fallback to default when errors is a string (potential limitation: ignores it)', () => {
        const payload = {
          errors: 'Something went wrong directly in errors'
        };
        expect(parseApiError(payload, fallback)).toBe(fallback);
      });

      it('should fallback when errors is null', () => {
        const payload = {
          errors: null,
          detail: 'Actual error detail'
        };
        expect(parseApiError(payload, fallback)).toBe('Actual error detail');
      });
    });
  });
});
