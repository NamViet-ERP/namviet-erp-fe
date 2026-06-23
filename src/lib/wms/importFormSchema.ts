import * as z from 'zod';
import { parseCurrencyInput } from '../../utils/currencyInput';

export const importLineSchema = z.object({
  materialCode: z.string().min(1, 'Chọn vật tư'),
  qty: z.string().refine(v => Number(v) > 0, 'Số lượng phải > 0'),
  unitPrice: z.string().refine(v => parseCurrencyInput(v) >= 0, 'Đơn giá không hợp lệ'),
});

export const importCreateSchema = z.object({
  projectCode: z.string().min(1, 'Chọn kho dự án'),
  items: z.array(importLineSchema).min(1, 'Thêm ít nhất một dòng vật tư'),
});

export type ImportCreateFormValues = z.infer<typeof importCreateSchema>;

export function validateImportCreate(projectCode: string, items: ImportCreateFormValues['items']) {
  return importCreateSchema.safeParse({ projectCode, items });
}
