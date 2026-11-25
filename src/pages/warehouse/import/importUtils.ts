import type { Import } from '../../../types';
import { displayValue, type VoucherDetailField } from '../../../components/warehouse/voucherDetailUtils';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import { getVoucherCreatedAt } from '../../../lib/wms/voucherDateUtils';
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

export function importDetailStatusHint(
  status: Import['status'],
  isDirect: boolean,
  evidenceEditable: boolean,
) {
  if (!evidenceEditable) return importStatusHint(status, isDirect);
  return isDirect
    ? 'Xuất thẳng: kiểm nhận SL, đủ chứng từ rồi duyệt. Tồn kho không tăng.'
    : 'Kiểm nhận SL thực tế / Lỗi / Thiếu, đủ chứng từ rồi duyệt';
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

export function buildImportDetailFields(
  selected: Import,
  projectName: (code?: string) => string,
): VoucherDetailField[] {
  const isDirect = Boolean(selected.isDirectProcurement);
  return [
    ...(isDirect ? [{ label: 'Loại', value: 'Xuất thẳng công trường' }] : []),
    { label: 'Kho dự án', value: selected.project ? projectName(selected.project) : displayValue() },
    { label: 'Nhà cung cấp', value: displayValue(selected.supplier) },
    { label: 'Mã đơn hàng', value: displayValue(selected.referenceCode) },
    { label: 'KHMH', value: displayValue(selected.planCode) },
    { label: 'Tạo lúc', value: displayValue(formatDateTimeVi(getVoucherCreatedAt(selected)?.toISOString())) },
    { label: 'Người lập', value: displayValue(selected.createdBy) },
    ...(isDirect && selected.linkedTicketCode
      ? [{ label: 'Phiếu xuất', value: displayValue(selected.linkedTicketCode) }]
      : []),
    ...(selected.linkedDefectTicketCode
      ? [{ label: 'HL liên kết', value: displayValue(selected.linkedDefectTicketCode) }]
      : []),
    { label: 'Ghi chú', value: displayValue(selected.note), wide: true },
  ];
}
