import * as z from 'zod';
import { getDuplicateMaterialLineErrors } from './voucherDuplicateMaterial';
import { getFrozenProjectError, type FrozenProjectMap } from './stocktakeFreeze';

export const exportLineSchema = z.object({
  materialCode: z.string().min(1, 'Vui lòng chọn vật tư'),
  qty: z.string().refine(v => Number(v) > 0, 'Vui lòng nhập số lượng lớn hơn 0'),
});

export const exportCreateSchema = z.object({
  projectCode: z.string().min(1, 'Vui lòng chọn kho dự án xuất vật tư'),
  items: z.array(exportLineSchema).min(1, 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ'),
});

export type ExportCreateFormValues = z.infer<typeof exportCreateSchema>;

export type ExportLineFieldErrors = {
  materialCode?: string;
};

export type ExportFormFieldErrors = {
  projectCode?: string;
  items?: string;
  lineErrors?: Record<number, ExportLineFieldErrors>;
};

export function validateExportCreate(projectCode: string, items: ExportCreateFormValues['items']) {
  return exportCreateSchema.safeParse({ projectCode, items });
}

export function getExportFormFieldErrors(
  projectCode: string,
  items: { materialCode: string; qty: string }[],
  stockOverflow?: boolean,
  frozenByProjectCode?: FrozenProjectMap,
): ExportFormFieldErrors {
  const errors: ExportFormFieldErrors = {};
  const projectFreezeError = getFrozenProjectError(frozenByProjectCode, projectCode);
  if (!projectCode.trim()) errors.projectCode = 'Vui lòng chọn kho dự án xuất vật tư';
  else if (projectFreezeError) errors.projectCode = projectFreezeError;
  const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
  if (validItems.length === 0) {
    errors.items = 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ';
  } else if (stockOverflow) {
    errors.items = 'Số lượng xuất vượt tồn khả dụng tại kho dự án';
  }

  const lineErrors = getDuplicateMaterialLineErrors(items);
  if (Object.keys(lineErrors).length > 0) errors.lineErrors = lineErrors;

  return errors;
}
