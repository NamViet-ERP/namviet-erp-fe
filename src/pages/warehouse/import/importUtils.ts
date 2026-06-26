import type { Import } from '../../../types';
import { parseCurrencyInput } from '../../../utils/currencyInput';
import type { MaterialQtyPriceLine } from '../voucher/voucherFormTypes';

export function importStatusHint(status: Import['status']) {
  if (status === 'draft') return 'Nháp — chưa ghi dự kiến';
  if (status === 'pending') return 'Nhập dự kiến — có thể sửa, chờ duyệt thực tế';
  if (status === 'approved') return 'Nhập thực tế — đã cộng tồn dự án, không sửa';
  return '';
}

export function importLineTotal(it: MaterialQtyPriceLine) {
  const qty = Number(it.qty) || 0;
  const price = parseCurrencyInput(it.unitPrice);
  return qty * price;
}
