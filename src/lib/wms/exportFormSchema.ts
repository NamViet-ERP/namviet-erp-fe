import * as z from 'zod';

export const exportLineSchema = z.object({
  materialCode: z.string().min(1, 'Chọn vật tư'),
  qty: z.string().refine(v => Number(v) > 0, 'Số lượng phải > 0'),
});

export const exportCreateSchema = z.object({
  projectCode: z.string().min(1, 'Chọn kho dự án xuất vật tư'),
  items: z.array(exportLineSchema).min(1, 'Thêm ít nhất một dòng vật tư'),
});

export type ExportCreateFormValues = z.infer<typeof exportCreateSchema>;

export function validateExportCreate(projectCode: string, items: ExportCreateFormValues['items']) {
  return exportCreateSchema.safeParse({ projectCode, items });
}
