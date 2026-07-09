import * as z from 'zod';
import { parseCurrencyInput } from '../../utils/currencyInput';
import { getDuplicateMaterialLineErrors } from './voucherDuplicateMaterial';
import { getFrozenProjectError, type FrozenProjectMap } from './stocktakeFreeze';

export const importLineSchema = z.object({
  materialCode: z.string().min(1, 'Vui lòng chọn vật tư'),
  qty: z.string().refine(v => Number(v) > 0, 'Vui lòng nhập số lượng lớn hơn 0'),
  unitPrice: z.string().refine(
    v => parseCurrencyInput(v) > 0,
    'Vui lòng nhập đơn giá lớn hơn 0',
  ),
});

export const importCreateSchema = z.object({
  projectCode: z.string().min(1, 'Vui lòng chọn kho dự án'),
  items: z.array(importLineSchema).min(1, 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ'),
});

export type ImportCreateFormValues = z.infer<typeof importCreateSchema>;

export type ImportLineFieldErrors = {
  materialCode?: string;
  qty?: string;
  unitPrice?: string;
};

export type ImportFormFieldErrors = {
  projectCode?: string;
  defaultSupplier?: string;
  referenceCode?: string;
  items?: string;
  lineErrors?: Record<number, ImportLineFieldErrors>;
};

function lineHasAnyInput(line: { materialCode: string; qty: string; unitPrice: string }) {
  return Boolean(
    line.materialCode.trim()
    || line.qty.trim()
    || parseCurrencyInput(line.unitPrice) > 0,
  );
}

export function getImportLineFieldErrors(line: {
  materialCode: string;
  qty: string;
  unitPrice: string;
}): ImportLineFieldErrors | null {
  if (!lineHasAnyInput(line)) return null;

  const errs: ImportLineFieldErrors = {};
  if (!line.materialCode.trim()) errs.materialCode = 'Vui lòng chọn vật tư';
  if (!(Number(line.qty) > 0)) errs.qty = 'Vui lòng nhập số lượng lớn hơn 0';
  if (!(parseCurrencyInput(line.unitPrice) > 0)) errs.unitPrice = 'Vui lòng nhập đơn giá lớn hơn 0';
  return Object.keys(errs).length > 0 ? errs : null;
}

export function isImportLineComplete(line: {
  materialCode: string;
  qty: string;
  unitPrice: string;
}) {
  return importLineSchema.safeParse(line).success;
}

export function validateImportCreate(projectCode: string, items: ImportCreateFormValues['items']) {
  return importCreateSchema.safeParse({ projectCode, items });
}

export function getImportFormFieldErrors(
  projectCode: string,
  referenceCode: string,
  defaultSupplier: string,
  supplierValid: boolean,
  items: { materialCode: string; qty: string; unitPrice: string }[],
  frozenByProjectCode?: FrozenProjectMap,
): ImportFormFieldErrors {
  const errors: ImportFormFieldErrors = {};
  const projectFreezeError = getFrozenProjectError(frozenByProjectCode, projectCode);
  if (!projectCode.trim()) errors.projectCode = 'Vui lòng chọn kho dự án';
  else if (projectFreezeError) errors.projectCode = projectFreezeError;
  if (!referenceCode.trim()) errors.referenceCode = 'Vui lòng nhập mã tham chiếu / PO';
  if (!defaultSupplier.trim() || !supplierValid) {
    errors.defaultSupplier = 'Vui lòng chọn NCC từ danh mục';
  }

  const lineErrors: Record<number, ImportLineFieldErrors> = {};
  items.forEach((line, idx) => {
    const rowErrs = getImportLineFieldErrors(line);
    if (rowErrs) lineErrors[idx] = rowErrs;
  });

  const duplicateErrors = getDuplicateMaterialLineErrors(items);
  Object.entries(duplicateErrors).forEach(([idx, dupErr]) => {
    const i = Number(idx);
    lineErrors[i] = { ...lineErrors[i], ...dupErr };
  });

  if (Object.keys(lineErrors).length > 0) errors.lineErrors = lineErrors;

  const completeLines = items.filter(isImportLineComplete);
  if (completeLines.length === 0) {
    errors.items = 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ (vật tư, số lượng, đơn giá).';
  }

  return errors;
}
