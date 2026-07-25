/** Đổi số tiền VND sang chữ (đủ dùng cho phiếu DNTT). */
const ONES = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const TEENS = [
  'mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm',
  'mười sáu', 'mười bảy', 'mười tám', 'mười chín',
];

function readTriple(n: number, full: boolean): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const ten = Math.floor(rest / 10);
  const one = rest % 10;
  const parts: string[] = [];

  if (hundred > 0) {
    parts.push(`${ONES[hundred]} trăm`);
  } else if (full && rest > 0) {
    parts.push('không trăm');
  }

  if (rest === 0) return parts.join(' ');

  if (rest < 10) {
    if (hundred > 0 || full) parts.push(`lẻ ${ONES[one]}`);
    else parts.push(ONES[one]);
    return parts.join(' ');
  }

  if (rest < 20) {
    parts.push(TEENS[rest - 10]);
    return parts.join(' ');
  }

  parts.push(ten === 1 ? 'mười' : `${ONES[ten]} mươi`);
  if (one === 1) parts.push('mốt');
  else if (one === 5) parts.push('lăm');
  else if (one > 0) parts.push(ONES[one]);
  return parts.join(' ');
}

export function amountToVietnameseWords(amount: number): string {
  const n = Math.round(Math.abs(amount));
  if (n === 0) return 'Không đồng';

  const billion = Math.floor(n / 1_000_000_000);
  const million = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousand = Math.floor((n % 1_000_000) / 1_000);
  const rem = n % 1_000;

  const parts: string[] = [];
  if (billion > 0) parts.push(`${readTriple(billion, false)} tỷ`);
  if (million > 0) parts.push(`${readTriple(million, billion > 0)} triệu`);
  if (thousand > 0) parts.push(`${readTriple(thousand, billion > 0 || million > 0)} nghìn`);
  if (rem > 0) parts.push(readTriple(rem, billion > 0 || million > 0 || thousand > 0));

  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} đồng`;
}
