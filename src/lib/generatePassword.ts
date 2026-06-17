/** Sinh mật khẩu tạm — đủ rule BE: ≥8 ký tự, có chữ hoa và số */
export function generateTempPassword(length = 10): string {
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = lower + upper + digits;

  const pick = (pool: string) => pool[Math.floor(Math.random() * pool.length)];
  const chars = [pick(upper), pick(digits), pick(lower), pick(all)];
  while (chars.length < length) chars.push(pick(all));

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
