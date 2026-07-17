/** Loại chứng từ mặc định — seed; user có thể thêm loại mới trên Thiết lập. */
export const PURCHASING_DOC_TYPES = [
  'Hợp đồng',
  'BBGH',
  'Hóa đơn',
  'Packing list',
  'DNTT',
  'CO / CQ',
] as const;

export type PurchasingDocType = (typeof PURCHASING_DOC_TYPES)[number];

export function defaultPurchasingDocTypes(): string[] {
  return [...PURCHASING_DOC_TYPES];
}
