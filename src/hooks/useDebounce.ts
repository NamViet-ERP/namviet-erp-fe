import { useEffect, useState } from 'react';

/**
 * Trì hoãn việc cập nhật giá trị cho đến khi người dùng ngừng thao tác trong khoảng thời gian delayMs.
 * Giúp triệt tiêu request dồn dập và lỗi đua dữ liệu (race conditions) khi gõ ô tìm kiếm/lọc API.
 *
 * @param value Giá trị đầu vào cần debounce
 * @param delayMs Thời gian chờ (mặc định 350ms)
 */
export function useDebounce<T>(value: T, delayMs = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
