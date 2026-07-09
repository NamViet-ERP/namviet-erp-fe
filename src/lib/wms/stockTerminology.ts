/** Single source of truth — công thức tồn kho Mayzer WMS (Phase 0). */

/** Kho công ty / kho tập trung — không nhầm với kho dự án. */
export const GENERAL_WAREHOUSE_LABEL = 'Kho trung tâm';
export const GENERAL_WAREHOUSE_LABEL_LOWER = 'kho trung tâm';

export const STOCK_FORMULA_LEGEND =
  `Khả dụng = (${GENERAL_WAREHOUSE_LABEL} − Xuất dự kiến) + Tồn thực tế dự án. ` +
  'Tồn dự kiến = Nhập dự kiến − Xuất dự kiến. ' +
  'Tồn kỳ vọng = Tồn thực tế + Tồn dự kiến. ' +
  'Giá BQ = đơn giá bình quân gia quyền (WAC) từ các phiếu nhập đã duyệt.';

export const STOCK_FORMULA_LEGEND_SHORT =
  `Khả dụng = (${GENERAL_WAREHOUSE_LABEL} − Xuất DK) + Tồn TT · Tồn DK = Nhập DK − Xuất DK · Tồn kỳ vọng = Tồn TT + Tồn DK`;
