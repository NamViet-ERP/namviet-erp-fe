/** Trả về thông báo lỗi hoặc null nếu hợp lệ. Một từ (≥2 ký tự) hoặc hai từ trở lên đều chấp nhận. */
export function validateFullName(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return 'Vui lòng nhập họ và tên';
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1 && words[0].length < 2) {
    return 'Vui lòng nhập họ và tên đầy đủ';
  }
  return null;
}
