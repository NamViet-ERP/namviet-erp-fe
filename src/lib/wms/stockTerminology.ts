/** Single source of truth — công thức tồn kho Mayzer WMS. */

/** Kho công ty / kho tập trung — không nhầm với kho dự án. */
export const GENERAL_WAREHOUSE_LABEL = 'Kho trung tâm';
export const GENERAL_WAREHOUSE_LABEL_LOWER = 'kho trung tâm';

/** Cột ma trận: Σ tồn các kho dự án. Không gồm kho trung tâm. */
export const PROJECT_STOCK_LABEL = 'Kho dự án';

/** Khả dụng gộp = (kho trung tâm − giữ) + Σ khả dụng từng dự án. */
export const COMBINED_AVAILABLE_LABEL = 'Khả dụng gộp';

export const STOCK_FORMULA_LEGEND =
  'Kho trung tâm và kho dự án là hai sổ riêng. ' +
  'Nhập mua vào dự án (đã xác nhận thực tế) chỉ cộng kho dự án, không cộng kho trung tâm. ' +
  'Xuất thẳng lấy từ kho trung tâm: xác nhận thực tế thì trừ kho trung tâm. ' +
  'Xuất kho dự án: xác nhận thực tế thì trừ kho dự án. ' +
  `${COMBINED_AVAILABLE_LABEL} = (kho trung tâm − giữ) + Σ(tồn dự án − xuất/CK dự kiến − HL chờ duyệt). ` +
  'Tồn DK dự án = tồn kho dự án + nhập/hoàn trả/chuyển dự kiến. ' +
  'Hàng lỗi = tổng SL phiếu HL chưa từ chối theo mã vật tư. ' +
  'Giá bình quân = WAC từ phiếu nhập đã duyệt trong 12 tháng (theo ngày duyệt).';

export const STOCK_FORMULA_LEGEND_SHORT =
  'Hai sổ riêng · nhập dự án không cộng kho trung tâm · xuất thẳng từ trung tâm trừ kho trung tâm khi xác nhận thực tế · khả dụng gộp = trung tâm còn trống + khả dụng các dự án';
