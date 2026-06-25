import * as z from 'zod';

export const transferLineSchema = z.object({
  materialCode: z.string().min(1, 'Vui lòng chọn vật tư'),
  qty: z.string().refine(v => Number(v) > 0, 'Vui lòng nhập số lượng lớn hơn 0'),
});

export const transferCreateSchema = z.object({
  projectCode: z.string().min(1, 'Vui lòng chọn kho dự án nguồn'),
  items: z.array(transferLineSchema).min(1, 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ'),
});

export type TransferCreateFormValues = z.infer<typeof transferCreateSchema>;

export type TransferFormFieldErrors = {
  projectCode?: string;
  toProjectCode?: string;
  items?: string;
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
): TransferFormFieldErrors {
  const errors: TransferFormFieldErrors = {};
  if (!projectCode.trim()) errors.projectCode = 'Vui lòng chọn kho dự án nguồn';
  if (transferMode === 'cross-project' && !toProjectCode.trim()) {
    errors.toProjectCode = 'Vui lòng chọn kho dự án đích';
  }
  const validItems = items.filter(it => it.materialCode && Number(it.qty) > 0);
  if (validItems.length === 0) {
    errors.items = 'Vui lòng thêm ít nhất một dòng vật tư hợp lệ';
  } else if (stockOverflow) {
    errors.items = 'Số lượng chuyển vượt tồn khả dụng tại kho dự án nguồn';
  }
  return errors;
}
