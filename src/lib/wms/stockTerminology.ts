/** Single source of truth — công thức tồn kho Mayzer WMS. */

/** Kho công ty / kho tập trung — không nhầm với kho dự án. */
export const GENERAL_WAREHOUSE_LABEL = 'Kho trung tâm';
export const GENERAL_WAREHOUSE_LABEL_LOWER = 'kho trung tâm';

export const STOCK_FORMULA_LEGEND =
  'Tồn thực tế = tồn hiện tại + nhập/hoàn trả/chuyển kho đã duyệt. ' +
  'Khả dụng = Tồn thực tế − xuất dự kiến − chuyển kho dự kiến − HL tồn kho chờ duyệt. ' +
  'Tồn dự kiến = Tồn thực tế + nhập/hoàn trả/chuyển kho dự kiến. ' +
  'Hàng lỗi = tổng SL phiếu HL chưa từ chối (nháp/chờ duyệt/đã duyệt) theo mã vật tư. ' +
  'Giá BQ = WAC từ phiếu nhập đã duyệt trong 12 tháng (theo ngày duyệt).';

export const STOCK_FORMULA_LEGEND_SHORT =
  'Tồn TT = đã duyệt · Khả dụng = TT − xuất/CK DK − HL chờ duyệt · Tồn DK = TT + nhập/HT/CK DK · Hàng lỗi = HL chưa từ chối · Giá BQ = WAC 12 tháng';
