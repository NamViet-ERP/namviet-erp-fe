import type { Export, ExportReturn, Import, Stocktake, Transfer } from '../../types';
import type { VoucherPrintPayload } from './printVoucher';
import { getVoucherStatusLabel } from './voucherStatusLabels';
import { formatDateTimeVi } from '../hrm/formatters';
import { getVoucherCreatedAt } from './voucherDateUtils';

export function buildImportPrintPayload(
  imp: Import,
  projectLabel: string,
  options: { showPrices?: boolean } = {},
): VoucherPrintPayload {
  const showPrices = options.showPrices !== false;
  return {
    title: 'Phiếu nhập kho',
    voucherCode: imp.voucherCode,
    statusLabel: getVoucherStatusLabel(imp.status, 'import'),
    fields: [
      { label: 'Kho dự án', value: projectLabel },
      { label: 'Nhà cung cấp', value: imp.supplier || '—' },
      { label: 'Mã đơn hàng', value: imp.referenceCode || '—' },
      { label: 'Người lập', value: imp.createdBy || '—' },
      { label: 'Tạo lúc', value: formatDateTimeVi(getVoucherCreatedAt(imp)?.toISOString()) || '—' },
      { label: 'Ghi chú', value: imp.note || '—' },
    ],
    columns: showPrices
      ? ['Vật tư', 'SL', 'ĐVT', 'Đơn giá', 'Thành tiền']
      : ['Vật tư', 'SL', 'ĐVT'],
    lines: imp.items.map(it => ({
      name: it.name,
      code: it.sku || it.productId,
      qty: it.qty,
      unit: it.unit,
      ...(showPrices
        ? { unitPrice: it.unitPrice, lineTotal: it.qty * it.unitPrice }
        : {}),
    })),
    ...(showPrices ? { grandTotal: imp.totalValue } : {}),
  };
}

export function buildExportPrintPayload(
  exp: Export,
  projectLabel: string,
): VoucherPrintPayload {
  return {
    title: 'Phiếu xuất kho',
    voucherCode: exp.voucherCode,
    statusLabel: getVoucherStatusLabel(exp.status, 'export'),
    fields: [
      { label: 'Kho dự án', value: projectLabel },
      { label: 'Khách hàng', value: exp.customer || '—' },
      { label: 'Mã đơn hàng', value: exp.soCode || '—' },
      { label: 'Người lập', value: exp.createdBy || '—' },
      { label: 'Tạo lúc', value: formatDateTimeVi(getVoucherCreatedAt(exp)?.toISOString()) || '—' },
      { label: 'Ghi chú', value: exp.note || '—' },
    ],
    columns: ['Vật tư', 'SL', 'ĐVT'],
    lines: exp.items.map(it => ({
      name: it.name,
      code: it.sku || it.productId,
      qty: it.qty,
      unit: it.unit,
    })),
  };
}

export function buildTransferPrintPayload(transfer: Transfer): VoucherPrintPayload {
  return {
    title: 'Phiếu chuyển kho',
    voucherCode: transfer.voucherCode,
    statusLabel: getVoucherStatusLabel(transfer.status, 'transfer'),
    fields: [
      { label: 'Kho nguồn', value: transfer.fromWarehouseName || '—' },
      { label: 'Kho đích', value: transfer.toWarehouseName || '—' },
      { label: 'Dự án nguồn', value: transfer.projectName || transfer.project || '—' },
      { label: 'Dự án đích', value: transfer.toProjectName || transfer.toProject || '—' },
      { label: 'Người lập', value: transfer.createdBy || '—' },
      { label: 'Ghi chú', value: transfer.note || '—' },
    ],
    columns: ['Vật tư', 'SL', 'ĐVT'],
    lines: transfer.items.map(it => ({
      name: it.name,
      code: it.sku || it.productId,
      qty: it.qty,
      unit: it.unit,
    })),
  };
}

export function buildExportReturnPrintPayload(
  row: ExportReturn,
  projectLabel: string,
): VoucherPrintPayload {
  return {
    title: 'Phiếu hoàn trả vật tư',
    voucherCode: row.voucherCode,
    statusLabel: getVoucherStatusLabel(row.status, 'exportReturn'),
    fields: [
      { label: 'Phiếu xuất nguồn', value: row.sourceExportCode || '—' },
      { label: 'Kho dự án', value: projectLabel },
      { label: 'Người lập', value: row.createdBy || '—' },
      { label: 'Tạo lúc', value: formatDateTimeVi(getVoucherCreatedAt(row)?.toISOString()) || '—' },
      { label: 'Ghi chú', value: row.note || '—' },
    ],
    columns: ['Vật tư', 'SL', 'ĐVT'],
    lines: row.items.map(it => ({
      name: it.name,
      code: it.sku || it.productId,
      qty: it.qty,
      unit: it.unit,
    })),
  };
}

export function buildStocktakePrintPayload(stocktake: Stocktake): VoucherPrintPayload {
  const statusLabel =
    stocktake.status === 'approved'
      ? 'Đã duyệt'
      : stocktake.status === 'pending'
        ? 'Chờ duyệt'
        : stocktake.status === 'cancelled'
          ? 'Đã hủy'
          : stocktake.status;

  return {
    title: 'Phiếu kiểm kê kho',
    voucherCode: stocktake.voucherCode,
    statusLabel,
    fields: [
      { label: 'Kho dự án', value: stocktake.warehouseName || '—' },
      { label: 'Người lập', value: stocktake.createdBy || '—' },
      { label: 'Ngày chứng từ', value: stocktake.date || '—' },
      { label: 'Ghi chú', value: stocktake.note || '—' },
    ],
    columns: ['Vật tư', 'Hệ thống', 'Thực tế', 'Chênh lệch', 'Lý do'],
    lines: stocktake.items.map(it => ({
      name: it.name,
      code: it.sku || it.productId,
      qty: it.systemQty,
      extra: String(it.actualQty),
      lineTotal: it.diff,
      reason: it.reason,
    })),
  };
}
