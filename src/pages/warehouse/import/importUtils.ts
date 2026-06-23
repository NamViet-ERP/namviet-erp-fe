import type { Import } from '../../../types';
import { parseCurrencyInput } from '../../../utils/currencyInput';
import type { MaterialQtyPriceLine } from '../voucher/voucherFormTypes';

export function importStatusHint(status: Import['status']) {
  if (status === 'draft') return 'Nháp — ghi dự kiến nhập dự án';
  if (status === 'pending') return 'Chờ thủ kho duyệt';
  if (status === 'approved') return 'Đã cộng tồn thực tế dự án';
  return '';
}

export function importLineTotal(it: MaterialQtyPriceLine) {
  const qty = Number(it.qty) || 0;
  const price = parseCurrencyInput(it.unitPrice);
  return qty * price;
}
