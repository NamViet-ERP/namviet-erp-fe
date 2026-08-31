import type { Import } from '../../../types';
import { parseCurrencyInput } from '../../../utils/currencyInput';
import type { MaterialQtyPriceLine } from '../voucher/voucherFormTypes';

export function importStatusHint(status: Import['status'], isDirect = false) {
  if (isDirect) {
    if (status === 'draft') return 'Nháp - chưa chốt xuất thẳng';
    if (status === 'pending') return 'Xuất thẳng dự kiến - chờ thủ kho kiểm nhận và duyệt, tồn không tăng';
    if (status === 'approved') return 'Xuất thẳng thực tế - đã giao công trường, tồn kho không tăng';
    return 'Xuất thẳng công trường';
  }
  if (status === 'draft') return 'Nháp - chưa ghi dự kiến';
  if (status === 'pending') return 'Nhập dự kiến - chờ thủ kho cập nhật chứng từ và duyệt thực tế';
  if (status === 'approved') return 'Nhập thực tế - đã cộng tồn dự án, không sửa';
  return '';
}

/** Xuất thẳng lấy hàng kho trung tâm: chưa ghi đơn giá (logic giá xử lý sau). */
export function isIssueFromGeneralWarehouse(
  imp: {
    issueFromGeneralWarehouse?: boolean;
    isDirectProcurement?: boolean;
    warehouseId?: string | null;
  } | null | undefined,
): boolean {
  if (!imp) return false;
  return Boolean(imp.issueFromGeneralWarehouse)
    || (Boolean(imp.isDirectProcurement) && Boolean(imp.warehouseId?.trim()));
}

export function importLineTotal(it: MaterialQtyPriceLine) {
  const qty = Number(it.qty) || 0;
  const price = parseCurrencyInput(it.unitPrice);
  return qty * price;
}
