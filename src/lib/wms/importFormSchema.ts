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

export function getImportLineFieldErrors(
  line: {
    materialCode: string;
    qty: string;
    unitPrice: string;
  },
  options: { requireUnitPrice?: boolean } = {},
): ImportLineFieldErrors | null {
  const requireUnitPrice = options.requireUnitPrice !== false;
  if (!lineHasAnyInput(line)) return null;

  const errs: ImportLineFieldErrors = {};
  if (!line.materialCode.trim()) errs.materialCode = 'Vui lòng chọn vật tư';
  if (!(Number(line.qty) > 0)) errs.qty = 'Vui lòng nhập số lượng lớn hơn 0';
  if (requireUnitPrice && !(parseCurrencyInput(line.unitPrice) > 0)) {
    errs.unitPrice = 'Vui lòng nhập đơn giá lớn hơn 0';
  }
  return Object.keys(errs).length > 0 ? errs : null;
}

export function isImportLineComplete(
  line: {
    materialCode: string;
    qty: string;
    unitPrice: string;
  },
  options: { requireUnitPrice?: boolean } = {},
) {
  const requireUnitPrice = options.requireUnitPrice !== false;
  if (requireUnitPrice) return importLineSchema.safeParse(line).success;
  return Boolean(line.materialCode.trim() && Number(line.qty) > 0);
}

export function validateImportCreate(
  projectCode: string,
  items: ImportCreateFormValues['items'],
  options: { requireUnitPrice?: boolean } = {},
) {
  const requireUnitPrice = options.requireUnitPrice !== false;
  if (requireUnitPrice) return importCreateSchema.safeParse({ projectCode, items });
  const qtyOnlySchema = z.object({
    projectCode: z.string().min(1, 'Vui lòng chọn kho dự án'),
    items: z
      .array(
        z.object({
          materialCode: z.string().min(1, 'Vui lòng chọn vật tư'),
          qty: z.string().refine(v => Number(v) > 0, 'Vui lòng nhập số lượng lớn hơn 0'),
          unitPrice: z.string().optional(),
        }),
      )
      .min(1, 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ'),
  });
  return qtyOnlySchema.safeParse({ projectCode, items });
}

export function getImportFormFieldErrors(
  projectCode: string,
  referenceCode: string,
  defaultSupplier: string,
  supplierValid: boolean,
  items: { materialCode: string; qty: string; unitPrice: string }[],
  frozenByProjectCode?: FrozenProjectMap,
  options: { requireUnitPrice?: boolean } = {},
): ImportFormFieldErrors {
  const requireUnitPrice = options.requireUnitPrice !== false;
  const errors: ImportFormFieldErrors = {};
  const projectFreezeError = getFrozenProjectError(frozenByProjectCode, projectCode);
  if (!projectCode.trim()) errors.projectCode = 'Vui lòng chọn kho dự án';
  else if (projectFreezeError) errors.projectCode = projectFreezeError;
  if (!referenceCode.trim()) errors.referenceCode = 'Vui lòng nhập mã đơn hàng';
  if (!defaultSupplier.trim() || !supplierValid) {
    errors.defaultSupplier = 'Vui lòng chọn NCC từ danh mục';
  }

  const lineErrors: Record<number, ImportLineFieldErrors> = {};
  items.forEach((line, idx) => {
    const rowErrs = getImportLineFieldErrors(line, { requireUnitPrice });
    if (rowErrs) lineErrors[idx] = rowErrs;
  });

  const duplicateErrors = getDuplicateMaterialLineErrors(items);
  Object.entries(duplicateErrors).forEach(([idx, dupErr]) => {
    const i = Number(idx);
    lineErrors[i] = { ...lineErrors[i], ...dupErr };
  });

  if (Object.keys(lineErrors).length > 0) errors.lineErrors = lineErrors;

  const completeLines = items.filter(line => isImportLineComplete(line, { requireUnitPrice }));
  if (completeLines.length === 0) {
    errors.items = requireUnitPrice
      ? 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ (vật tư, số lượng, đơn giá).'
      : 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ (vật tư, số lượng).';
  }

  return errors;
}
