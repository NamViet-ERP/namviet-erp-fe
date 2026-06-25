import * as z from 'zod';
import { parseCurrencyInput } from '../../utils/currencyInput';

export const importLineSchema = z.object({
  materialCode: z.string().min(1, 'Vui lòng chọn vật tư'),
  qty: z.string().refine(v => Number(v) > 0, 'Vui lòng nhập số lượng lớn hơn 0'),
  unitPrice: z.string().refine(v => parseCurrencyInput(v) >= 0, 'Vui lòng nhập đơn giá hợp lệ'),
});

export const importCreateSchema = z.object({
  projectCode: z.string().min(1, 'Vui lòng chọn kho dự án'),
  items: z.array(importLineSchema).min(1, 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ'),
});

export type ImportCreateFormValues = z.infer<typeof importCreateSchema>;

export type ImportFormFieldErrors = {
  projectCode?: string;
  defaultSupplier?: string;
  referenceCode?: string;
  items?: string;
};

export function validateImportCreate(projectCode: string, items: ImportCreateFormValues['items']) {
  return importCreateSchema.safeParse({ projectCode, items });
}

export function getImportFormFieldErrors(
  projectCode: string,
  referenceCode: string,
  defaultSupplier: string,
  supplierValid: boolean,
  items: { materialCode: string; qty: string }[],
): ImportFormFieldErrors {
  const errors: ImportFormFieldErrors = {};
  if (!projectCode.trim()) errors.projectCode = 'Vui lòng chọn kho dự án';
  if (!referenceCode.trim()) errors.referenceCode = 'Vui lòng nhập mã tham chiếu / PO';
  if (!defaultSupplier.trim() || !supplierValid) {
    errors.defaultSupplier = 'Vui lòng chọn NCC từ danh mục';
  }
  const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
  if (validItems.length === 0) {
    errors.items = 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ';
  }
  return errors;
}
