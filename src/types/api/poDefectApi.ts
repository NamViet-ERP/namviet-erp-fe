/** Preview / create phiếu hàng lỗi từ PO — khớp BE PoDefectDtos. */

export interface PoDefectLinePreviewApiDto {
  poItemId: number;
  name: string;
  materialCode?: string | null;
  unit: string;
  ordered: number;
  received: number;
  defected: number;
  reservedPendingNk: number;
  reservedPendingDefect: number;
  available: number;
  unitPrice: number;
}

export interface PoDefectPreviewApiDto {
  poCode: string;
  planCode: string;
  projectCode: string;
  supplierName: string;
  lines: PoDefectLinePreviewApiDto[];
}

export interface CreateDefectFromPoLineRequest {
  poItemId: number;
  qty: number;
  lineReason?: string | null;
}

export interface CreateDefectFromPoRequest {
  items: CreateDefectFromPoLineRequest[];
  reason?: string | null;
  note?: string | null;
}

export interface PurchaseDefectItemApiDto {
  id: number;
  poItemId: number;
  materialCode?: string | null;
  name: string;
  unit: string;
  quantity: number;
  lineReason?: string | null;
}

export interface PurchaseDefectAttachmentApiDto {
  id: string;
  kind: string;
  fileName: string;
  storageKey: string;
  uploadedAt: string;
}

export interface PurchaseDefectApiDto {
  id: string;
  ticketCode: string;
  poCode: string;
  planCode: string;
  projectCode: string;
  supplierName?: string | null;
  status: string;
  reason?: string | null;
  note?: string | null;
  createdByName: string;
  createdAt: string;
  approvedByName?: string | null;
  approvedAt?: string | null;
  items: PurchaseDefectItemApiDto[];
  attachments: PurchaseDefectAttachmentApiDto[];
}
