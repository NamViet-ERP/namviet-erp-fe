import { downloadCsv } from '../../../lib/csvExport';
import type {
  usePriceBookEstimates,
  usePriceBookMargins,
} from '../../../hooks/usePurchasePriceBook';
import type { PriceBookItemApiDto } from '../../../types/api/purchasingApi';

export type PriceBookTab = 'items' | 'matrix' | 'rfq' | 'groups' | 'estimates' | 'margins';
export type PriceBookPeriodType = 'all' | 'month' | 'quarter' | 'year';

export const PRICE_BOOK_THIS_YEAR = new Date().getFullYear();
export const PRICE_BOOK_YEARS = Array.from({ length: 5 }, (_, i) => PRICE_BOOK_THIS_YEAR - i);

export const PRICE_BOOK_TABS: { id: PriceBookTab; label: string }[] = [
  { id: 'items', label: 'Sổ giá theo mặt hàng' },
  { id: 'matrix', label: 'So sánh giá NCC' },
  { id: 'rfq', label: 'Giá chào thầu (RFQ)' },
  { id: 'groups', label: 'Phân tích theo nhóm hàng' },
  { id: 'estimates', label: 'Giá dự toán & Chênh lệch' },
  { id: 'margins', label: 'Phân tích Mua vào - Bán ra' },
];

export const PRICE_BOOK_TAB_INTRO: Record<PriceBookTab, string> = {
  items: 'Sổ giá tổng hợp lịch sử mua thực tế từ PO đã chốt theo mặt hàng: giá mới nhất, giá dự toán (từ tab Giá dự toán & Chênh lệch), số NCC, xu hướng và cảnh báo khi vượt giá trần.',
  matrix: 'Bảng so sánh giá gần nhất của các NCC cho từng mặt hàng trong cùng nhóm hàng. Ô có dấu ★ là giá thấp nhất giữa các NCC đã từng báo / bán mặt hàng đó.',
  rfq: 'Ghi lại tất cả báo giá nhận được cho một mặt hàng, kể cả báo giá không được chọn, để có nền tảng thương lượng cho các lần mua sau.',
  groups: 'Tổng hợp chi tiêu và biến động giá theo từng nhóm hàng, giúp nhìn nhóm nào chiếm tỷ trọng lớn để ưu tiên đàm phán.',
  estimates: 'So sánh giá dự toán (giá công ty) với giá mua thực tế trên PO đã chốt để biết đang mua rẻ hơn hay đắt hơn dự toán.',
  margins: 'So sánh giá bán / giá chào cho dự án với giá mua thực tế để nhìn margin theo từng mặt hàng.',
};

export function periodRange(type: PriceBookPeriodType, year: number, quarter: number, month: number) {
  if (type === 'all') return { from: undefined as string | undefined, to: undefined as string | undefined };
  if (type === 'year') return { from: `${year}-01-01`, to: `${year}-12-31` };
  if (type === 'quarter') {
    const start = (quarter - 1) * 3 + 1;
    const endMonth = start + 2;
    const lastDay = new Date(year, endMonth, 0).getDate();
    return {
      from: `${year}-${String(start).padStart(2, '0')}-01`,
      to: `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${String(month).padStart(2, '0')}-01`,
    to: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function categoryOption(c: { code: string; name: string }) {
  return `${c.code} - ${c.name}`;
}

export function trendClass(pct: number | null | undefined) {
  if (pct == null || pct === 0) return 'text-[var(--md-on-surface-variant)]';
  return pct > 0 ? 'text-[var(--md-success)]' : 'text-[var(--md-error)]';
}

export function trendLabel(pct: number | null | undefined) {
  if (pct == null) return '—';
  if (pct === 0) return '0%';
  return `${pct > 0 ? '▲' : '▼'} ${pct > 0 ? '+' : ''}${pct}%`;
}

export function exportItemsCsv(rows: PriceBookItemApiDto[]) {
  void downloadCsv(
    'SoGia_MatHang.csv',
    [
      'Mã hàng',
      'Tên hàng',
      'Quy cách',
      'Thông số kỹ thuật chung',
      'Giá mua mới nhất',
      'Giá dự toán',
      'Chênh lệch',
      'Chênh lệch %',
      'NCC gần nhất',
      'Giá min',
      'Giá max',
      'Số NCC',
      'Xu hướng %',
      'Giá trần',
    ],
    rows.map(r => [
      r.materialCode,
      r.materialName,
      r.technicalSpec ?? '',
      r.generalTechnicalSpec ?? '',
      r.latestPrice != null ? String(r.latestPrice) : '',
      r.estimatePrice != null ? String(r.estimatePrice) : '',
      r.estimateDiff != null ? String(r.estimateDiff) : '',
      r.estimateDiffPct != null ? String(r.estimateDiffPct) : '',
      r.latestSupplierName ?? '',
      r.minPrice != null ? String(r.minPrice) : '',
      r.maxPrice != null ? String(r.maxPrice) : '',
      String(r.supplierCount),
      r.trendPct != null ? String(r.trendPct) : '',
      r.ceilingPrice != null ? String(r.ceilingPrice) : '',
    ]),
  );
}

export function exportEstimatesCsv(
  rows: NonNullable<ReturnType<typeof usePriceBookEstimates>['data']>,
) {
  void downloadCsv(
    'GiaDuToan_ChenhLech.csv',
    ['Mã hàng', 'Tên hàng', 'Dự án', 'Giá dự toán', 'Giá mua mới nhất', 'Chênh lệch', 'Biên lợi nhuận %'],
    rows.map(r => [
      r.materialCode,
      r.materialName,
      r.projectCode ?? '',
      String(r.estimatePrice),
      r.purchaseLatest != null ? String(r.purchaseLatest) : '',
      r.diff != null ? String(r.diff) : '',
      r.marginPct != null ? String(r.marginPct) : '',
    ]),
  );
}

export function exportMarginsCsv(
  rows: NonNullable<ReturnType<typeof usePriceBookMargins>['data']>,
) {
  void downloadCsv(
    'PhanTich_MuaVaoBanRa.csv',
    ['Mã hàng', 'Tên hàng', 'Dự án', 'Giá bán', 'Giá mua TB', 'Giá mua mới', 'Biên', 'Biên %'],
    rows.map(r => [
      r.materialCode,
      r.materialName,
      r.projectCode ?? '',
      String(r.sellPrice),
      r.purchaseAvg != null ? String(r.purchaseAvg) : '',
      r.purchaseLatest != null ? String(r.purchaseLatest) : '',
      r.margin != null ? String(r.margin) : '',
      r.marginPct != null ? String(r.marginPct) : '',
    ]),
  );
}

export function estimateMarginBadge(pct: number | null | undefined) {
  if (pct == null) return 'badge-neutral';
  if (pct >= 10) return 'badge-success';
  if (pct >= 0) return 'badge-warning';
  return 'badge-error';
}

export function marginPctBadge(pct: number | null | undefined) {
  if (pct == null) return 'badge-neutral';
  if (pct >= 20) return 'badge-success';
  if (pct >= 10) return 'badge-warning';
  return 'badge-error';
}

export function historyKindBadge(kind: string, status?: string | null) {
  if (kind === 'po' || kind === 'plan' || kind === 'import') return 'badge-success';
  if (kind === 'sell' || kind === 'estimate') return 'badge-info';
  if (status === 'won') return 'badge-success';
  if (status === 'active') return 'badge-warning';
  if (status === 'lost' || status === 'expired') return 'badge-error';
  return 'badge-neutral';
}
