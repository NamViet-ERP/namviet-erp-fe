import type { PurchaseOrderDocType } from '../../types/api/purchaseOrderAttachmentApi';

export const PURCHASE_DOC_TYPE_OPTIONS: Array<{ value: PurchaseOrderDocType; label: string }> = [
  { value: 'co', label: 'C/O' },
  { value: 'cq', label: 'C/Q' },
  { value: 'cnxk', label: 'CN xuất xưởng' },
  { value: 'bbgh', label: 'Biên bản giao hàng' },
  { value: 'bbnt', label: 'Biên bản nghiệm thu' },
  { value: 'tokhai', label: 'Tờ khai' },
  { value: 'invoice', label: 'IV / Hóa đơn' },
  { value: 'pl', label: 'Packing list (PL)' },
  { value: 'contract', label: 'Hợp đồng' },
  { value: 'other', label: 'Khác' },
];

export function purchaseDocTypeLabel(docType: string | null | undefined): string {
  const hit = PURCHASE_DOC_TYPE_OPTIONS.find(o => o.value === docType);
  return hit?.label ?? (docType || '—');
}
