import { getFrozenProjectError, type FrozenProjectMap } from './stocktakeFreeze';

export type ExportReturnFormFieldErrors = {
  projectCode?: string;
  sourceExportId?: string;
  lines?: string;
  note?: string;
};

export function getExportReturnFormFieldErrors(
  projectCode: string,
  sourceExportId: string,
  lines: { sku: string; returnQty: string; remainingQty: number }[],
  qtyOverflow?: boolean,
  frozenByProjectCode?: FrozenProjectMap,
  note?: string,
): ExportReturnFormFieldErrors {
  const errors: ExportReturnFormFieldErrors = {};
  const projectFreezeError = getFrozenProjectError(frozenByProjectCode, projectCode);
  if (!projectCode.trim()) errors.projectCode = 'Vui lòng chọn kho dự án';
  else if (projectFreezeError) errors.projectCode = projectFreezeError;
  if (!sourceExportId.trim()) errors.sourceExportId = 'Vui lòng chọn phiếu xuất nguồn';
  if (note !== undefined && !note.trim()) errors.note = 'Vui lòng nhập lý do hoàn trả';

  const validLines = lines.filter(l => l.sku && Number(l.returnQty) > 0);
  if (validLines.length === 0) {
    errors.lines = 'Vui lòng nhập ít nhất một dòng hoàn trả hợp lệ';
  } else if (qtyOverflow) {
    errors.lines = 'Số lượng hoàn trả vượt phần còn lại trên phiếu xuất';
  }
  return errors;
}
