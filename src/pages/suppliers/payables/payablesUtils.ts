import { downloadCsv } from '../../../lib/csvExport';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import type { SupplierPayableLineApiDto } from '../../../types/api/purchasingApi';

export type StatusFilter = '' | 'unpaid' | 'partial' | 'overdue' | 'paid';

export const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: '', label: 'Tất cả' },
  { id: 'unpaid', label: 'Chưa thanh toán' },
  { id: 'partial', label: 'Thanh toán 1 phần' },
  { id: 'overdue', label: 'Quá hạn' },
  { id: 'paid', label: 'Đã thanh toán đủ' },
];

export function lineStatusLabel(line: SupplierPayableLineApiDto) {
  if (line.lineStatus === 'paid') return 'Đã TT đủ';
  if (line.lineStatus === 'overdue') return `Quá hạn ${line.daysOverdue} ngày`;
  if (line.lineStatus === 'partial') return `TT một phần - còn ${formatCurrencyFull(line.outstanding)}`;
  return 'Chưa TT';
}

export function lineStatusClass(line: SupplierPayableLineApiDto) {
  if (line.lineStatus === 'paid') return 'badge badge-success';
  if (line.lineStatus === 'overdue') return 'badge badge-error';
  return 'badge badge-warning';
}

export function exportLinesCsv(lines: SupplierPayableLineApiDto[]) {
  const header = [
    'NCC', 'Mã NCC', 'Dự án', 'PO', 'DNTT', 'Ngày PO', 'Giá trị', 'Điều khoản',
    'Hạn TT', 'Đã thanh toán', 'Còn nợ', 'Trạng thái', 'Số ngày quá hạn',
  ];
  const rows = lines.map(line => [
    line.supplierName,
    line.supplierCode,
    line.projectName || line.projectCode,
    line.poCode,
    line.paymentCode,
    line.poDate,
    line.requested,
    line.paymentTerm,
    line.dueDate,
    line.paid,
    line.outstanding,
    line.lineStatus === 'paid' && (line.paidAt || line.paidByName)
      ? [lineStatusLabel(line), formatDateTimeVi(line.paidAt ?? undefined), line.paidByName?.trim()]
        .filter(Boolean)
        .join(' - ')
      : lineStatusLabel(line),
    line.daysOverdue,
  ]);
  void downloadCsv(`CongNo_NCC_${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
}
