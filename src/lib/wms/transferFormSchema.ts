import * as z from 'zod';

export const transferLineSchema = z.object({
  materialCode: z.string().min(1, 'Chọn vật tư'),
  qty: z.string().refine(v => Number(v) > 0, 'Số lượng phải > 0'),
});

export const transferCreateSchema = z.object({
  projectCode: z.string().min(1, 'Chọn kho dự án nguồn'),
  items: z.array(transferLineSchema).min(1, 'Thêm ít nhất một dòng vật tư'),
});

export type TransferCreateFormValues = z.infer<typeof transferCreateSchema>;

export function validateTransferCreate(projectCode: string, items: TransferCreateFormValues['items']) {
  return transferCreateSchema.safeParse({ projectCode, items });
}
