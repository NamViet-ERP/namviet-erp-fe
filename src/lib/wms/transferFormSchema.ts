import * as z from 'zod';
import { getDuplicateMaterialLineErrors } from './voucherDuplicateMaterial';
import { getFrozenProjectError, type FrozenProjectMap } from './stocktakeFreeze';

export const transferLineSchema = z.object({
  materialCode: z.string().min(1, 'Vui lòng chọn vật tư'),
  qty: z.string().refine(v => Number(v) > 0, 'Vui lòng nhập số lượng lớn hơn 0'),
});

export const transferCreateSchema = z.object({
  projectCode: z.string().min(1, 'Vui lòng chọn kho dự án nguồn'),
  items: z.array(transferLineSchema).min(1, 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ'),
});

export type TransferCreateFormValues = z.infer<typeof transferCreateSchema>;

export type TransferLineFieldErrors = {
  materialCode?: string;
};

export type TransferFormFieldErrors = {
  projectCode?: string;
  toProjectCode?: string;
  items?: string;
  lineErrors?: Record<number, TransferLineFieldErrors>;
};

export function validateTransferCreate(projectCode: string, items: TransferCreateFormValues['items']) {
  return transferCreateSchema.safeParse({ projectCode, items });
}

export function getTransferFormFieldErrors(
  projectCode: string,
  toProjectCode: string,
  transferMode: 'return' | 'cross-project',
  items: { materialCode: string; qty: string }[],
  stockOverflow?: boolean,
  frozenByProjectCode?: FrozenProjectMap,
): TransferFormFieldErrors {
  const errors: TransferFormFieldErrors = {};
  const sourceFreezeError = getFrozenProjectError(frozenByProjectCode, projectCode);
  if (!projectCode.trim()) errors.projectCode = 'Vui lòng chọn kho dự án nguồn';
  else if (sourceFreezeError) errors.projectCode = sourceFreezeError;

  if (transferMode === 'cross-project') {
    const destFreezeError = getFrozenProjectError(frozenByProjectCode, toProjectCode);
    if (!toProjectCode.trim()) errors.toProjectCode = 'Vui lòng chọn kho dự án đích';
    else if (destFreezeError) errors.toProjectCode = destFreezeError;
  }
  const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
  if (validItems.length === 0) {
    errors.items = 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ';
  } else if (stockOverflow) {
    errors.items = 'Số lượng chuyển vượt tồn khả dụng tại kho dự án nguồn';
  }

  const lineErrors = getDuplicateMaterialLineErrors(items);
  if (Object.keys(lineErrors).length > 0) errors.lineErrors = lineErrors;

  return errors;
}
